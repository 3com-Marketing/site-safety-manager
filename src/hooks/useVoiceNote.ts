import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export type VoiceDialogStep = 'recording' | 'improving' | 'reviewing';

export function useVoiceNote(categoriaLabel: string) {
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');
  const shouldKeepRecordingRef = useRef<boolean>(false);
  const restartTimerRef = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [rawTranscript, setRawTranscript] = useState('');
  const [improvedText, setImprovedText] = useState('');
  const [normativa, setNormativa] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState<VoiceDialogStep>('recording');

  const clearRestartTimer = () => {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  const createRecognition = useCallback(() => {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      // Procesar SOLO los resultados nuevos (desde resultIndex), no desde 0.
      // En móvil, event.results puede contener el histórico completo y, al
      // recorrerlo desde 0, se duplican frases. Acumulamos los finales en
      // una ref persistente y mostramos finalRef + interim.
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          finalTranscriptRef.current += transcript;
          // Asegurar separación entre frases.
          if (!/\s$/.test(finalTranscriptRef.current)) {
            finalTranscriptRef.current += ' ';
          }
        } else {
          interim += transcript;
        }
      }
      setRawTranscript((finalTranscriptRef.current + interim).trimStart());
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      // Errores recuperables: dejamos que onend reinicie si procede.
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        toast.error('Permiso de micrófono denegado');
        shouldKeepRecordingRef.current = false;
        setIsRecording(false);
      } else if (event.error === 'aborted') {
        // Parada intencional — no hacer nada, onend se encarga.
      } else if (
        event.error === 'no-speech' ||
        event.error === 'audio-capture' ||
        event.error === 'network'
      ) {
        // Recuperables — onend reiniciará si shouldKeepRecording sigue true.
      } else {
        toast.error('Error en el reconocimiento de voz');
      }
    };

    recognition.onend = () => {
      // En móvil (Chrome Android, Safari iOS) el motor termina solo a los
      // pocos segundos aunque continuous=true. Si el usuario no ha pulsado
      // parar, reiniciamos automáticamente para que perciba grabación continua.
      if (shouldKeepRecordingRef.current) {
        clearRestartTimer();
        restartTimerRef.current = window.setTimeout(() => {
          if (!shouldKeepRecordingRef.current) return;
          try {
            recognition.start();
          } catch (err) {
            // Si ya está iniciado o falla, recreamos en el próximo ciclo.
            console.warn('Recognition restart failed, recreating:', err);
            try {
              const fresh = createRecognition();
              recognitionRef.current = fresh;
              fresh.start();
            } catch (e) {
              console.error('Recognition restart fully failed:', e);
              setIsRecording(false);
            }
          }
        }, 250);
      } else {
        setIsRecording(false);
      }
    };

    return recognition;
  }, []);

  const startRecording = useCallback(() => {
    if (!SpeechRecognition) {
      toast.error('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }

    // Resetear acumulador
    finalTranscriptRef.current = '';
    setRawTranscript('');
    shouldKeepRecordingRef.current = true;

    try {
      const recognition = createRecognition();
      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recognition:', err);
      toast.error('No se pudo iniciar la grabación');
      shouldKeepRecordingRef.current = false;
      setIsRecording(false);
    }
  }, [createRecognition]);

  const stopRecording = useCallback(() => {
    shouldKeepRecordingRef.current = false;
    clearRestartTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const openDialog = useCallback(() => {
    finalTranscriptRef.current = '';
    setRawTranscript('');
    setImprovedText('');
    setNormativa('');
    setDialogStep('recording');
    setShowDialog(true);
  }, []);

  const closeDialog = useCallback(() => {
    stopRecording();
    setShowDialog(false);
  }, [stopRecording]);

  const improveText = useCallback(async (texto: string) => {
    setDialogStep('improving');
    setIsImproving(true);

    try {
      const { data, error } = await supabase.functions.invoke('mejorar-texto', {
        body: { texto, categoria: categoriaLabel },
      });

      if (error) {
        console.error('AI error:', error);
        toast.error('No se pudo mejorar el texto. Se usará el original.');
      } else {
        setImprovedText(data.texto_mejorado || texto);
        setNormativa(data.normativa || '');
      }
    } catch (err) {
      console.error('AI error:', err);
      toast.error('No se pudo mejorar el texto. Se usará el original.');
    }

    setIsImproving(false);
    setDialogStep('reviewing');
  }, [categoriaLabel]);

  const finishRecording = useCallback(() => {
    stopRecording();
    const finalText = (finalTranscriptRef.current || rawTranscript).trim();
    if (!finalText) {
      toast.error('No se ha detectado ningún texto');
      return;
    }
    // Mostrar el texto crudo para revisar — sin llamada a IA.
    setImprovedText(finalText);
    setDialogStep('reviewing');
  }, [stopRecording, rawTranscript]);

  useEffect(() => {
    return () => {
      shouldKeepRecordingRef.current = false;
      clearRestartTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isRecording,
    rawTranscript,
    improvedText,
    setImprovedText,
    normativa,
    setNormativa,
    isImproving,
    showDialog,
    dialogStep,
    startRecording,
    stopRecording,
    openDialog,
    closeDialog,
    finishRecording,
    improveText,
  };
}
