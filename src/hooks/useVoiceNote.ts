import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export type VoiceDialogStep = 'recording' | 'improving' | 'reviewing';

// ─── Helpers de normalización ────────────────────────────────────────────────

// Normaliza una palabra: minúsculas, sin signos de puntuación.
const normWord = (w: string) =>
  w
    .toLowerCase()
    .replace(/[.,;:!?¡¿"'()\-–—]/g, '')
    .trim();

// Convierte una cadena en array de palabras normalizadas (sin vacíos).
const toWords = (s: string) => s.split(/\s+/).map(normWord).filter(Boolean);

// Devuelve el mayor solape entre el final de `a` y el principio de `b`,
// comparando palabras normalizadas. Se requiere un solape mínimo de 2 palabras
// para evitar falsos positivos con palabras comunes ("y", "de"...).
const overlapWordCount = (a: string, b: string, minOverlap = 2): number => {
  const aw = toWords(a);
  const bw = toWords(b);
  if (!aw.length || !bw.length) return 0;
  const max = Math.min(aw.length, bw.length, 30);
  for (let len = max; len >= minOverlap; len--) {
    let match = true;
    for (let k = 0; k < len; k++) {
      if (aw[aw.length - len + k] !== bw[k]) {
        match = false;
        break;
      }
    }
    if (match) return len;
  }
  return 0;
};

// Recorta el principio de `incoming` que ya estaba al final de `committed`.
// Trabaja sobre las palabras originales para preservar capitalización.
const stripLeadingOverlap = (committed: string, incoming: string): string => {
  if (!committed.trim() || !incoming.trim()) return incoming;
  const overlap = overlapWordCount(committed, incoming);
  if (overlap === 0) return incoming;
  const incomingWords = incoming.trim().split(/\s+/);
  return incomingWords.slice(overlap).join(' ');
};

// Detecta si `b` está totalmente contenido al final de `a` (subcadena de palabras).
const containsAtEnd = (a: string, b: string): boolean => {
  const aw = toWords(a);
  const bw = toWords(b);
  if (!bw.length || bw.length > aw.length) return false;
  for (let k = 0; k < bw.length; k++) {
    if (aw[aw.length - bw.length + k] !== bw[k]) return false;
  }
  return true;
};

const joinPieces = (pieces: string[]) =>
  pieces
    .map((p) => p.trim())
    .filter(Boolean)
    .join(' ');

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useVoiceNote(categoriaLabel: string) {
  const recognitionRef = useRef<any>(null);
  // Texto consolidado (deduplicado) que sí se mantiene entre reinicios.
  const committedTextRef = useRef<string>('');
  // Finales de la sesión actual, indexados por posición del resultado.
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

  // Calcula el texto "útil" de la sesión actual eliminando duplicados respecto
  // al texto ya comprometido. Maneja los tres casos típicos del motor móvil:
  //   1) la sesión repite literal el final del committed → todo solapa
  //   2) la sesión empieza con texto viejo y añade nuevo → recortar el principio
  //   3) la sesión es enteramente texto nuevo → no hacer nada
  const dedupeAgainstCommitted = (sessionText: string): string => {
    if (!sessionText.trim()) return '';
    if (!committedTextRef.current.trim()) return sessionText;

    // Caso 1: sessionText cabe entero al final del committed → ya está dicho.
    if (containsAtEnd(committedTextRef.current, sessionText)) return '';

    // Caso 2: solape parcial de palabras al principio.
    const cleaned = stripLeadingOverlap(committedTextRef.current, sessionText);
    return cleaned;
  };

  const buildDisplay = (interim: string) => {
    const sessionText = joinPieces(sessionFinalsRef.current);
    const usefulSession = dedupeAgainstCommitted(sessionText);

    // El interim también puede repetir el final → recortarlo igual.
    let usefulInterim = interim;
    if (usefulInterim) {
      const base = joinPieces([committedTextRef.current, usefulSession]);
      if (containsAtEnd(base, usefulInterim)) {
        usefulInterim = '';
      } else {
        usefulInterim = stripLeadingOverlap(base, usefulInterim);
      }
    }

    return joinPieces([committedTextRef.current, usefulSession, usefulInterim]);
  };

  // Mueve la sesión actual al texto comprometido (deduplicado) y la vacía.
  const commitSession = () => {
    const sessionText = joinPieces(sessionFinalsRef.current);
    sessionFinalsRef.current = [];
    if (!sessionText) return;
    const cleaned = dedupeAgainstCommitted(sessionText);
    if (!cleaned) return;
    committedTextRef.current = joinPieces([committedTextRef.current, cleaned]);
  };

  const createRecognition = useCallback(() => {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript: string = result[0].transcript || '';
        if (result.isFinal) {
          // Sobrescribir el slot por índice: si el motor refina o reenvía el
          // mismo índice, no se acumula.
          sessionFinalsRef.current[i] = transcript;
        } else if (i === event.results.length - 1) {
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
      } else if (
        event.error === 'aborted' ||
        event.error === 'no-speech' ||
        event.error === 'audio-capture' ||
        event.error === 'network'
      ) {
        // Recuperables — onend gestiona.
      } else {
        toast.error('Error en el reconocimiento de voz');
      }
    };

    recognition.onend = () => {
      // Consolidar lo de la sesión actual con dedupe.
      commitSession();
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
        }, 300);
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
