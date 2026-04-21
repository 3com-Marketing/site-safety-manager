import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Pencil, Scale, Camera, Mic, FileText, ChevronLeft, CheckCircle2, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useVoiceNote } from '@/hooks/useVoiceNote';
import VoiceNoteDialog from './VoiceNoteDialog';
import FotoViewer from './FotoViewer';

interface Anotacion {
  id: string;
  texto: string;
  normativa?: string;
  foto_url: string | null;
  etiqueta?: string;
  created_at: string;
}

interface Props {
  bloqueId: string;
  categoria: string;
  categoriaLabel: string;
  anotaciones: Anotacion[];
  visitaId: string;
  obraNombre: string;
  onBack: () => void;
  onRefresh: () => void;
  bloqueEstado?: string;
  onMarcarCompletado?: () => void;
  prevSeccionLabel?: string;
  onPrevSeccion?: () => void;
}

export default function ChecklistBloque({
  bloqueId,
  categoriaLabel,
  anotaciones,
  visitaId,
  obraNombre,
  onBack,
  onRefresh,
  bloqueEstado,
  onMarcarCompletado,
  prevSeccionLabel,
  onPrevSeccion,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingFoto, setViewingFoto] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showManualNote, setShowManualNote] = useState(false);
  const [manualNoteText, setManualNoteText] = useState('');

  const voice = useVoiceNote(categoriaLabel);

  const handlePhotoCapture = () => fileInputRef.current?.click();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const ext = file.name.split('.').pop();
    const path = `${visitaId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('incidencia-fotos').upload(path, file);
    if (uploadError) { toast.error('Error al subir foto'); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from('incidencia-fotos').getPublicUrl(path);

    const fotoCount = anotaciones.filter(a => a.foto_url).length;
    const etiqueta = `${categoriaLabel} - Foto ${fotoCount + 1} | ${obraNombre} | ${format(new Date(), "dd MMM yyyy, HH:mm", { locale: es })}`;

    const { error } = await supabase.from('anotaciones').insert({
      bloque_id: bloqueId,
      texto: '',
      foto_url: urlData.publicUrl,
      etiqueta,
    });

    if (error) toast.error('Error al guardar anotación');
    else toast.success('Foto añadida');
    setUploading(false);
    e.target.value = '';
    onRefresh();
  };

  const saveImprovedNote = async () => {
    if (!voice.improvedText.trim()) return;

    const { error } = await supabase.from('anotaciones').insert({
      bloque_id: bloqueId,
      texto: voice.improvedText.trim(),
      normativa: voice.normativa || '',
    });

    if (error) { toast.error('Error al guardar nota'); return; }
    toast.success('Nota guardada');
    voice.closeDialog();
    onRefresh();
  };

  const saveManualNote = async () => {
    if (!manualNoteText.trim()) return;
    const { error } = await supabase.from('anotaciones').insert({
      bloque_id: bloqueId,
      texto: manualNoteText.trim(),
    });
    if (error) { toast.error('Error al guardar nota'); return; }
    toast.success('Nota guardada');
    setManualNoteText('');
    setShowManualNote(false);
    onRefresh();
  };

  const startEditAnotacion = (a: Anotacion) => { setEditingId(a.id); setEditText(a.texto); };

  const saveEditAnotacion = async () => {
    if (!editingId) return;
    await supabase.from('anotaciones').update({ texto: editText.trim() }).eq('id', editingId);
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

  const isCompleted = bloqueEstado === 'completado';

  return (
    <div className="space-y-5">
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />

      {/* Breadcrumb header */}
      <div className="space-y-1">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <ChevronLeft className="h-4 w-4" />
          {obraNombre}
        </button>
        <h2 className="font-heading text-xl font-bold">{categoriaLabel}</h2>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={handlePhotoCapture} className="field-action-btn">
          <Camera className="h-7 w-7 text-primary" />
          <span className="label">Foto</span>
        </button>
        <button onClick={voice.openDialog} className="field-action-btn">
          <Mic className="h-7 w-7 text-primary" />
          <span className="label">Voz</span>
        </button>
        <button onClick={() => setShowManualNote(true)} className="field-action-btn">
          <StickyNote className="h-7 w-7 text-primary" />
          <span className="label">Nota</span>
        </button>
      </div>

      {/* Manual note input */}
      {showManualNote && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Textarea
            value={manualNoteText}
            onChange={(e) => setManualNoteText(e.target.value)}
            placeholder="Escribe tu anotación aquí..."
            className="min-h-[80px] text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={saveManualNote} disabled={!manualNoteText.trim()} className="flex-1">Guardar nota</Button>
            <Button size="sm" variant="outline" onClick={() => { setShowManualNote(false); setManualNoteText(''); }} className="flex-1">Cancelar</Button>
          </div>
        </div>
      )}

      {/* Anotaciones list */}
      <div className="space-y-3">
        <h3 className="font-heading text-sm font-semibold">Anotaciones ({anotaciones.length})</h3>

        {anotaciones.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Sin anotaciones aún.<br />Usa los botones de arriba para añadir.</p>
          </div>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditAnotacion(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteAnotacion(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {a.foto_url && (
                  <>
                    <img src={a.foto_url} alt="Foto anotación" className="w-full max-h-[400px] rounded-lg object-contain bg-muted/50 border border-border cursor-pointer" onClick={() => setViewingFoto(a.foto_url)} />
                    <p className="text-[11px] text-muted-foreground text-center mt-1">📅 {format(new Date(a.created_at), "dd MMM yyyy, HH:mm", { locale: es })}</p>
                  </>
                )}
                {editingId === a.id ? (
                  <div className="space-y-2">
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[80px] text-sm" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEditAnotacion} className="flex-1">Guardar</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="flex-1">Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  a.texto && <p className="text-sm text-foreground">{a.texto}</p>
                )}
                {a.normativa && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Scale className="h-3 w-3 text-primary" />
                      <p className="text-[10px] font-semibold text-primary">Normativa</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground whitespace-pre-line">{a.normativa}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contextual bottom bar */}
      {(prevSeccionLabel || onMarcarCompletado) && (
        <div className="flex gap-2 pt-2">
          {prevSeccionLabel && onPrevSeccion && (
            <Button variant="outline" onClick={onPrevSeccion} className="h-12 flex-1 text-sm font-semibold gap-1">
              <ChevronLeft className="h-4 w-4" />
              {prevSeccionLabel}
            </Button>
          )}
          {onMarcarCompletado && (
            <Button
              onClick={onMarcarCompletado}
              className={`h-12 flex-1 text-sm font-bold gap-1 ${isCompleted ? 'bg-success hover:bg-success/90 text-success-foreground' : ''}`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isCompleted ? 'Completado' : 'Marcar completado'}
            </Button>
          )}
        </div>
      )}

      <VoiceNoteDialog
        open={voice.showDialog}
        onOpenChange={(open) => { if (!open) voice.closeDialog(); }}
        dialogStep={voice.dialogStep}
        isRecording={voice.isRecording}
        rawTranscript={voice.rawTranscript}
        improvedText={voice.improvedText}
        onImprovedTextChange={voice.setImprovedText}
        normativa={voice.normativa}
        onStartRecording={voice.startRecording}
        onStopRecording={voice.stopRecording}
        onFinishRecording={voice.finishRecording}
        onSave={saveImprovedNote}
        onRepeat={voice.openDialog}
      />

      <FotoViewer url={viewingFoto} onClose={() => setViewingFoto(null)} editable onSave={async (newUrl) => {
        const a = anotaciones.find(an => an.foto_url === viewingFoto);
        if (a) await supabase.from('anotaciones').update({ foto_url: newUrl }).eq('id', a.id);
        setViewingFoto(null);
        onRefresh();
      }} visitaId={visitaId} />

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
