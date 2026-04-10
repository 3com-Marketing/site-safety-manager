import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export type VoiceDialogStep = 'recording' | 'improving' | 'editing';

export function useVoiceNote(categoriaLabel: string) {
  const recognitionRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [rawTranscript, setRawTranscript] = useState('');
  const [improvedText, setImprovedText] = useState('');
  const [normativa, setNormativa] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState<VoiceDialogStep>('recording');

  const startRecording = useCallback(() => {
    if (!SpeechRecognition) {
      toast.error('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interim = transcript;
        }
      }
      setRawTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        toast.error('Error en el reconocimiento de voz');
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const openDialog = useCallback(() => {
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
        setImprovedText(texto);
        setNormativa('');
        toast.error('No se pudo mejorar el texto. Se usará el original.');
      } else {
        setImprovedText(data.texto_mejorado || texto);
        setNormativa(data.normativa || '');
      }
    } catch (err) {
      console.error('AI error:', err);
      setImprovedText(texto);
      setNormativa('');
      toast.error('No se pudo mejorar el texto. Se usará el original.');
    }

    setIsImproving(false);
    setDialogStep('editing');
  }, [categoriaLabel]);

  const finishRecording = useCallback(async () => {
    stopRecording();
    if (!rawTranscript.trim()) {
      toast.error('No se ha detectado ningún texto');
      return;
    }
    await improveText(rawTranscript.trim());
  }, [stopRecording, rawTranscript, improveText]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
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
  };
}
