import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export type VoiceDialogStep = 'recording' | 'improving' | 'reviewing';

// ─── Detección de móvil ──────────────────────────────────────────────────────
const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
};

// ─── Helpers de normalización ────────────────────────────────────────────────

const normWord = (w: string) =>
  w
    .toLowerCase()
    .replace(/[.,;:!?¡¿"'()\-–—]/g, '')
    .trim();

const toWords = (s: string) => s.split(/\s+/).map(normWord).filter(Boolean);

const normalizeText = (s: string) => toWords(s).join(' ');

// ¿`b` empieza por `a` (comparando palabras normalizadas)?
const startsWithWords = (a: string, b: string): boolean => {
  const aw = toWords(a);
  const bw = toWords(b);
  if (!aw.length || aw.length > bw.length) return false;
  for (let i = 0; i < aw.length; i++) {
    if (aw[i] !== bw[i]) return false;
  }
  return true;
};

// Mayor solape entre el final de `a` y el principio de `b` (en palabras).
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
const stripLeadingOverlap = (committed: string, incoming: string): string => {
  if (!committed.trim() || !incoming.trim()) return incoming;
  const overlap = overlapWordCount(committed, incoming);
  if (overlap === 0) return incoming;
  const incomingWords = incoming.trim().split(/\s+/);
  return incomingWords.slice(overlap).join(' ');
};

// ¿`b` está totalmente contenido al final de `a`?
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

  // Texto consolidado entre reinicios.
  const committedTextRef = useRef<string>('');

  // Resultado por slot dentro de la sesión actual. Cada slot guarda la mejor
  // versión final conocida para ese índice. En móvil, un mismo slot puede
  // refinarse muchas veces (prefijos acumulativos): se conserva la versión más
  // larga/estable.
  const sessionFinalsRef = useRef<string[]>([]);

  const shouldKeepRecordingRef = useRef<boolean>(false);
  const restartTimerRef = useRef<number | null>(null);
  const isMobileRef = useRef<boolean>(isMobileDevice());

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

  // Construye el texto canónico de la sesión actual eliminando "escaleras de
  // prefijos" entre slots consecutivos. Caso típico de Android Chrome:
  //   slot[0] = "la"
  //   slot[1] = "la señalización"
  //   slot[2] = "la señalización está mal"
  // → debe quedar solo "la señalización está mal".
  const buildSessionText = (): string => {
    const slots = sessionFinalsRef.current.filter(Boolean).map((s) => s.trim());
    if (!slots.length) return '';

    const out: string[] = [];
    for (const piece of slots) {
      if (!piece) continue;
      const last = out[out.length - 1];

      // Duplicado exacto (normalizado) → ignorar.
      if (last && normalizeText(last) === normalizeText(piece)) continue;

      // El nuevo es ampliación del anterior (mismo prefijo) → reemplazar.
      if (last && startsWithWords(last, piece)) {
        out[out.length - 1] = piece;
        continue;
      }

      // El anterior contiene al nuevo como prefijo o subcadena al final → ignorar.
      if (last && (startsWithWords(piece, last) || containsAtEnd(last, piece))) {
        continue;
      }

      // Solape parcial al principio del nuevo respecto al final del anterior.
      if (last) {
        const trimmed = stripLeadingOverlap(last, piece);
        if (!trimmed.trim()) continue;
        out.push(trimmed);
      } else {
        out.push(piece);
      }
    }

    return joinPieces(out);
  };

  // Deduplica el texto de sesión contra el committed (entre reinicios).
  const dedupeAgainstCommitted = (sessionText: string): string => {
    if (!sessionText.trim()) return '';
    if (!committedTextRef.current.trim()) return sessionText;
    if (containsAtEnd(committedTextRef.current, sessionText)) return '';
    if (startsWithWords(committedTextRef.current, sessionText)) {
      // Toda la sesión coincide con el principio del committed → nada nuevo.
      return '';
    }
    return stripLeadingOverlap(committedTextRef.current, sessionText);
  };

  const buildDisplay = (interim: string) => {
    const sessionText = buildSessionText();
    const usefulSession = dedupeAgainstCommitted(sessionText);

    let usefulInterim = interim.trim();
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
    const sessionText = buildSessionText();
    sessionFinalsRef.current = [];
    if (!sessionText) return;
    const cleaned = dedupeAgainstCommitted(sessionText);
    if (!cleaned) return;
    committedTextRef.current = joinPieces([committedTextRef.current, cleaned]);
  };

  const createRecognition = useCallback(() => {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    // En móvil, `continuous = true` provoca el patrón de "escalera de
    // prefijos". Forzamos ciclos cortos: el motor entrega y nosotros
    // reiniciamos con `onend`, manteniendo la grabación viva para el usuario.
    recognition.continuous = !isMobileRef.current;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = '';
      const startIdx = typeof event.resultIndex === 'number' ? event.resultIndex : 0;

      // Solo reconsideramos los slots que han cambiado.
      for (let i = startIdx; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript: string = (result[0]?.transcript || '').trim();
        if (!transcript) continue;

        if (result.isFinal) {
          const prev = sessionFinalsRef.current[i] || '';
          // Si el motor reenvía exactamente lo mismo, no tocar.
          if (normalizeText(prev) === normalizeText(transcript)) {
            sessionFinalsRef.current[i] = transcript;
            continue;
          }
          // Quedarnos con la versión más larga (suele ser la más completa).
          if (prev && startsWithWords(transcript, prev)) {
            // El nuevo es subprefijo del anterior → conservar el anterior.
            continue;
          }
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
      // Consolidar el ciclo actual y limpiar slots para el siguiente.
      commitSession();
      setRawTranscript(buildDisplay(''));

      if (shouldKeepRecordingRef.current) {
        clearRestartTimer();
        // En móvil reiniciamos rápido para mantener la sensación de continuo.
        const delay = isMobileRef.current ? 150 : 300;
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
        }, delay);
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
