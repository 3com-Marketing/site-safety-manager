import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Camera, Mic, MicOff, Trash2, Sparkles, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Anotacion {
  id: string;
  texto: string;
  foto_url: string | null;
  created_at: string;
}

interface Props {
  bloqueId: string;
  categoria: string;
  categoriaLabel: string;
  estado: string;
  anotaciones: Anotacion[];
  visitaId: string;
  onBack: () => void;
  onRefresh: () => void;
}

// Check browser support for Web Speech API
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function ChecklistBloque({
  bloqueId,
  categoria,
  categoriaLabel,
  anotaciones,
  visitaId,
  onBack,
  onRefresh,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const [uploading, setUploading] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [rawTranscript, setRawTranscript] = useState('');
  const [improvedText, setImprovedText] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState<'recording' | 'improving' | 'editing'>('recording');

  // Editing existing annotation
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handlePhotoCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const ext = file.name.split('.').pop();
    const path = `${visitaId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('incidencia-fotos')
      .upload(path, file);

    if (uploadError) {
      toast.error('Error al subir foto');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('incidencia-fotos')
      .getPublicUrl(path);

    const { error } = await supabase.from('anotaciones').insert({
      bloque_id: bloqueId,
      texto: '',
      foto_url: urlData.publicUrl,
    });

    if (error) {
      toast.error('Error al guardar anotación');
    } else {
      toast.success('Foto añadida');
    }
    setUploading(false);
    e.target.value = '';
    onRefresh();
  };

  // Voice recording
  const startRecording = () => {
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
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const openVoiceDialog = () => {
    setRawTranscript('');
    setImprovedText('');
    setDialogStep('recording');
    setShowVoiceDialog(true);
  };

  const handleFinishRecording = async () => {
    stopRecording();
    if (!rawTranscript.trim()) {
      toast.error('No se ha detectado ningún texto');
      return;
    }
    await improveText(rawTranscript.trim());
  };

  const improveText = async (texto: string) => {
    setDialogStep('improving');
    setIsImproving(true);

    try {
      const { data, error } = await supabase.functions.invoke('mejorar-texto', {
        body: { texto, categoria: categoriaLabel },
      });

      if (error) {
        console.error('AI error:', error);
        // Fallback: use raw text
        setImprovedText(texto);
        toast.error('No se pudo mejorar el texto. Se usará el original.');
      } else {
        setImprovedText(data.texto_mejorado || texto);
      }
    } catch (err) {
      console.error('AI error:', err);
      setImprovedText(texto);
      toast.error('No se pudo mejorar el texto. Se usará el original.');
    }

    setIsImproving(false);
    setDialogStep('editing');
  };

  const saveImprovedNote = async () => {
    if (!improvedText.trim()) return;

    const { error } = await supabase.from('anotaciones').insert({
      bloque_id: bloqueId,
      texto: improvedText.trim(),
    });

    if (error) {
      toast.error('Error al guardar nota');
      return;
    }

    toast.success('Nota guardada');
    setShowVoiceDialog(false);
    setRawTranscript('');
    setImprovedText('');
    onRefresh();
  };

  const startEditAnotacion = (a: Anotacion) => {
    setEditingId(a.id);
    setEditText(a.texto);
  };

  const saveEditAnotacion = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from('anotaciones')
      .update({ texto: editText.trim() })
      .eq('id', editingId);

    if (error) {
      toast.error('Error al actualizar');
      return;
    }
    toast.success('Nota actualizada');
    setEditingId(null);
    setEditText('');
    onRefresh();
  };

  const deleteAnotacion = async (anotacionId: string) => {
    await supabase.from('anotaciones').delete().eq('id', anotacionId);
    toast.success('Anotación eliminada');
    onRefresh();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="space-y-5">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-heading text-base font-semibold">{categoriaLabel}</h2>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handlePhotoCapture} className="field-action-btn">
          <span className="icon">📷</span>
          <span className="label">Foto</span>
        </button>
        <button onClick={openVoiceDialog} className="field-action-btn">
          <span className="icon">🎤</span>
          <span className="label">Nota por voz</span>
        </button>
      </div>

      {/* Anotaciones list */}
      <div className="space-y-3">
        <h3 className="font-heading text-sm font-semibold">
          Anotaciones ({anotaciones.length})
        </h3>

        {anotaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin anotaciones aún. Usa los botones de arriba.</p>
        ) : (
          <div className="space-y-2">
            {anotaciones.map((a) => (
              <div key={a.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(a.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                  </p>
                  <div className="flex gap-1 shrink-0">
                    {a.texto && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => startEditAnotacion(a)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteAnotacion(a.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {a.foto_url && (
                  <img
                    src={a.foto_url}
                    alt="Foto anotación"
                    className="w-full max-h-48 rounded-lg object-cover border border-border"
                  />
                )}
                {editingId === a.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[80px] text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEditAnotacion} className="flex-1">
                        Guardar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="flex-1">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  a.texto && <p className="text-sm text-foreground">{a.texto}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice recording dialog */}
      <Dialog open={showVoiceDialog} onOpenChange={(open) => {
        if (!open) {
          stopRecording();
          setShowVoiceDialog(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {dialogStep === 'recording' && 'Grabar nota de voz'}
              {dialogStep === 'improving' && 'Mejorando texto...'}
              {dialogStep === 'editing' && 'Revisar nota'}
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Recording */}
          {dialogStep === 'recording' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 py-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex h-20 w-20 items-center justify-center rounded-full transition-all active:scale-95 ${
                    isRecording
                      ? 'bg-destructive text-destructive-foreground animate-pulse'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                </button>
                <p className="text-sm text-muted-foreground text-center">
                  {isRecording
                    ? 'Escuchando... Pulsa para detener'
                    : 'Pulsa para empezar a hablar'}
                </p>
              </div>

              {rawTranscript && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground mb-1">Transcripción:</p>
                  <p className="text-sm">{rawTranscript}</p>
                </div>
              )}

              <Button
                onClick={handleFinishRecording}
                disabled={!rawTranscript.trim()}
                className="h-12 w-full text-base font-semibold gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Mejorar con IA
              </Button>
            </div>
          )}

          {/* Step 2: AI improving */}
          {dialogStep === 'improving' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Procesando con IA...</p>
            </div>
          )}

          {/* Step 3: Edit result */}
          {dialogStep === 'editing' && (
            <div className="space-y-4">
              {rawTranscript !== improvedText && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground mb-1">Texto original:</p>
                  <p className="text-xs text-muted-foreground italic">{rawTranscript}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-2">Resultado (editable):</p>
                <Textarea
                  value={improvedText}
                  onChange={(e) => setImprovedText(e.target.value)}
                  className="min-h-[120px] text-base"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={saveImprovedNote}
                  disabled={!improvedText.trim()}
                  className="h-12 flex-1 text-base font-semibold"
                >
                  Guardar nota
                </Button>
                <Button
                  variant="outline"
                  onClick={openVoiceDialog}
                  className="h-12"
                >
                  Repetir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload overlay */}
      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50">
          <div className="rounded-xl bg-card p-6 text-center">
            <p className="font-heading font-semibold">Subiendo foto...</p>
          </div>
        </div>
      )}
    </div>
  );
}
