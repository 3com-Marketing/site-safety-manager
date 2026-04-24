import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export type VoiceDialogStep = 'recording' | 'improving' | 'reviewing';

// Normaliza para comparación: minúsculas, sin signos de puntuación, sin espacios extra.
const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[.,;:!?¡¿"'()\-–—]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// Devuelve `incoming` recortado eliminando el solape inicial que ya estaba al final
// de `committed`. Útil cuando un motor móvil reanuda y vuelve a entregar las
// últimas palabras de la sesión anterior.
const stripOverlap = (committed: string, incoming: string): string => {
  const c = normalize(committed);
  const i = normalize(incoming);
  if (!c || !i) return incoming;
  const max = Math.min(c.length, i.length, 200);
  for (let len = max; len >= 4; len--) {
    if (c.endsWith(i.slice(0, len))) {
      // Mapear el recorte normalizado de vuelta al string original.
      // Aproximación: contar palabras del trozo solapado y saltarlas en `incoming`.
      const overlapWords = i.slice(0, len).trim().split(' ').length;
      const words = incoming.trim().split(/\s+/);
      return words.slice(overlapWords).join(' ');
    }
  }
  return incoming;
};

const joinPieces = (pieces: string[]) =>
  pieces
    .map((p) => p.trim())
    .filter(Boolean)
    .join(' ');

export function useVoiceNote(categoriaLabel: string) {
  const recognitionRef = useRef<any>(null);
  // Texto de sesiones de reconocimiento ya cerradas (cuando onend reinicia el motor).
  const committedTextRef = useRef<string>('');
  // Finales de la sesión actual, indexados por posición del resultado.
  // Si el motor refina un resultado, sobrescribimos el slot en vez de duplicar.
  const sessionFinalsRef = useRef<string[]>([]);
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

  const buildDisplay = (interim: string) => {
    const sessionText = joinPieces(sessionFinalsRef.current);
    return joinPieces([committedTextRef.current, sessionText, interim]);
  };

  // Mueve la sesión actual al texto comprometido, deduplicando solape.
  const commitSession = () => {
    const sessionText = joinPieces(sessionFinalsRef.current);
    sessionFinalsRef.current = [];
    if (!sessionText) return;
    const cleaned = stripOverlap(committedTextRef.current, sessionText);
    if (!cleaned) return;
    committedTextRef.current = joinPieces([committedTextRef.current, cleaned]);
  };

  const createRecognition = useCallback(() => {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      // Estrategia: tratamos los finales de la sesión como un array indexado por `i`.
      // - Si el motor refina un resultado existente, sobrescribimos el slot.
      // - Si llega uno nuevo, lo añadimos en su índice.
      // - El interim se muestra aparte y NUNCA se acumula.
      // Así, aunque el motor móvil vuelva a entregar resultados ya vistos en la
      // misma sesión, no se duplican (ocupan el mismo índice).
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript: string = result[0].transcript || '';
        if (result.isFinal) {
          sessionFinalsRef.current[i] = transcript;
        } else if (i === event.results.length - 1) {
          // Solo nos interesa el último interim (el "en curso").
          interim = transcript;
        }
      }
      setRawTranscript(buildDisplay(interim));
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        toast.error('Permiso de micrófono denegado');
        shouldKeepRecordingRef.current = false;
        setIsRecording(false);
      } else if (event.error === 'aborted') {
        // Parada intencional — onend se encarga.
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
      // Mover la sesión actual a "committed" antes de reiniciar (con dedupe).
      // Así, en la nueva sesión, sessionFinalsRef arranca vacío y no se mezcla
      // con índices viejos.
      commitSession();
      // Refrescar display con el texto consolidado.
      setRawTranscript(buildDisplay(''));

      if (shouldKeepRecordingRef.current) {
        clearRestartTimer();
        restartTimerRef.current = window.setTimeout(() => {
          if (!shouldKeepRecordingRef.current) return;
          try {
            recognition.start();
          } catch (err) {
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

    // Resetear acumuladores
    committedTextRef.current = '';
    sessionFinalsRef.current = [];
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
    // Consolidar lo que quede en sesión.
    commitSession();
    setRawTranscript(buildDisplay(''));
    setIsRecording(false);
  }, []);

  const openDialog = useCallback(() => {
    committedTextRef.current = '';
    sessionFinalsRef.current = [];
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
    // stopRecording ya consolidó la sesión.
    const finalText = (committedTextRef.current || rawTranscript).trim();
    if (!finalText) {
      toast.error('No se ha detectado ningún texto');
      return;
    }
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
