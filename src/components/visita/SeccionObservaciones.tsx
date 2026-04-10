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

interface Observacion {
  id: string;
  texto: string;
  normativa: string;
  foto_url: string | null;
  created_at: string;
}

interface Props {
  informeId: string;
  visitaId: string;
  onBack: () => void;
  onRefresh: () => void;
}

export default function SeccionObservaciones({ informeId, visitaId, onBack, onRefresh }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Observacion[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);

  const voice = useVoiceNote('Observaciones generales de obra');

  const fetchItems = async () => {
    const { data } = await supabase
      .from('observaciones')
      .select('*')
      .eq('informe_id', informeId)
      .order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [informeId]);

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

    const { error } = await supabase.from('observaciones').insert({
      informe_id: informeId,
      texto: '',
      foto_url: urlData.publicUrl,
    });

    if (error) toast.error('Error al guardar');
    else toast.success('Foto añadida');

    setUploading(false);
    e.target.value = '';
    await fetchItems();
    onRefresh();
  };

  const saveVoiceNote = async () => {
    if (!voice.improvedText.trim()) return;

    const { error } = await supabase.from('observaciones').insert({
      informe_id: informeId,
      texto: voice.improvedText.trim(),
      normativa: voice.normativa || '',
    });

    if (error) { toast.error('Error al guardar'); return; }
    toast.success('Observación guardada');
    voice.closeDialog();
    await fetchItems();
    onRefresh();
  };

  const startEdit = (item: Observacion) => { setEditingId(item.id); setEditText(item.texto); };

  const saveEdit = async () => {
    if (!editingId) return;
    await supabase.from('observaciones').update({ texto: editText.trim() }).eq('id', editingId);
    toast.success('Actualizada');
    setEditingId(null);
    await fetchItems();
  };

  const deleteItem = async (id: string) => {
    await supabase.from('observaciones').delete().eq('id', id);
    toast.success('Eliminada');
    await fetchItems();
    onRefresh();
  };

  return (
    <div className="space-y-5">
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
        <h2 className="font-heading text-base font-semibold">Observaciones</h2>
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
        <h3 className="font-heading text-sm font-semibold">Observaciones ({items.length})</h3>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin observaciones. Usa los botones de arriba.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(item.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                  </p>
                  <div className="flex gap-1 shrink-0">
                    {item.texto && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {item.foto_url && (
                  <img src={item.foto_url} alt="Foto" className="w-full max-h-48 rounded-lg object-cover border border-border" />
                )}
                {editingId === item.id ? (
                  <div className="space-y-2">
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[80px] text-sm" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} className="flex-1">Guardar</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="flex-1">Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  item.texto && <p className="text-sm text-foreground">{item.texto}</p>
                )}
                {item.normativa && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Scale className="h-3 w-3 text-primary" />
                      <p className="text-[10px] font-semibold text-primary">Normativa</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground whitespace-pre-line">{item.normativa}</p>
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
