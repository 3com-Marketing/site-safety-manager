import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Trash2, Pencil, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useVoiceNote } from '@/hooks/useVoiceNote';
import VoiceNoteDialog from './VoiceNoteDialog';
import FotoViewer from './FotoViewer';

interface Incidencia {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  normativa: string;
  fotos: { id: string; url: string }[];
  created_at: string;
}

interface Props {
  informeId: string;
  visitaId: string;
  onBack: () => void;
  onRefresh: () => void;
}

export default function SeccionIncidencias({ informeId, visitaId, onBack, onRefresh }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);

  const voice = useVoiceNote('Incidencias de seguridad');

  const fetchIncidencias = async () => {
    const { data } = await supabase
      .from('incidencias')
      .select('id, titulo, descripcion, categoria, normativa, created_at, fotos(id, url)')
      .eq('informe_id', informeId)
      .order('created_at', { ascending: false });

    setIncidencias(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchIncidencias(); }, [informeId]);

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

    const { data: inc, error: incError } = await supabase
      .from('incidencias')
      .insert({ informe_id: informeId, titulo: 'Incidencia con foto', categoria: 'general', descripcion: '' })
      .select('id')
      .single();

    if (incError || !inc) { toast.error('Error al crear incidencia'); setUploading(false); return; }

    await supabase.from('fotos').insert({ incidencia_id: inc.id, url: urlData.publicUrl });

    toast.success('Foto añadida');
    setUploading(false);
    e.target.value = '';
    await fetchIncidencias();
    onRefresh();
  };

  const saveVoiceNote = async () => {
    if (!voice.improvedText.trim()) return;

    const { error } = await supabase.from('incidencias').insert({
      informe_id: informeId,
      titulo: voice.improvedText.trim().slice(0, 60),
      categoria: 'general',
      descripcion: voice.improvedText.trim(),
      normativa: voice.normativa || '',
    });

    if (error) { toast.error('Error al guardar'); return; }
    toast.success('Incidencia guardada');
    voice.closeDialog();
    await fetchIncidencias();
    onRefresh();
  };

  const startEdit = (inc: Incidencia) => { setEditingId(inc.id); setEditText(inc.descripcion); };

  const saveEdit = async () => {
    if (!editingId) return;
    await supabase.from('incidencias').update({ descripcion: editText.trim(), titulo: editText.trim().slice(0, 60) }).eq('id', editingId);
    toast.success('Actualizada');
    setEditingId(null);
    await fetchIncidencias();
  };

  const deleteIncidencia = async (id: string) => {
    await supabase.from('fotos').delete().eq('incidencia_id', id);
    await supabase.from('incidencias').delete().eq('id', id);
    toast.success('Incidencia eliminada');
    await fetchIncidencias();
    onRefresh();
  };

  return (
    <div className="space-y-5">
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
        <h2 className="font-heading text-base font-semibold">Incidencias</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={handlePhotoCapture} className="field-action-btn">
          <span className="icon">📷</span>
          <span className="label">Foto</span>
        </button>
        <button onClick={voice.openDialog} className="field-action-btn">
          <span className="icon">🎤</span>
          <span className="label">Nota por voz</span>
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="font-heading text-sm font-semibold">Incidencias ({incidencias.length})</h3>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : incidencias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin incidencias. Usa los botones de arriba.</p>
        ) : (
          <div className="space-y-2">
            {incidencias.map((inc) => (
              <div key={inc.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(inc.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                  </p>
                  <div className="flex gap-1 shrink-0">
                    {inc.descripcion && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(inc)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteIncidencia(inc.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {inc.fotos?.map((f) => (
                  <img key={f.id} src={f.url} alt="Foto" className="w-full max-h-48 rounded-lg object-cover border border-border" />
                ))}
                {editingId === inc.id ? (
                  <div className="space-y-2">
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[80px] text-sm" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} className="flex-1">Guardar</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="flex-1">Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  inc.descripcion && <p className="text-sm text-foreground">{inc.descripcion}</p>
                )}
                {inc.normativa && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Scale className="h-3 w-3 text-primary" />
                      <p className="text-[10px] font-semibold text-primary">Normativa</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground whitespace-pre-line">{inc.normativa}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
        onSave={saveVoiceNote}
        onRepeat={voice.openDialog}
      />

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
