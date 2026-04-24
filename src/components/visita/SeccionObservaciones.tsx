import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Pencil, Scale, ChevronLeft, Camera, Mic, StickyNote, FileText } from 'lucide-react';
import EditableTextWithAI from './EditableTextWithAI';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useVoiceNote } from '@/hooks/useVoiceNote';
import VoiceNoteDialog from './VoiceNoteDialog';
import FotoViewer from './FotoViewer';

interface Observacion {
  id: string;
  texto: string;
  normativa: string;
  foto_url: string | null;
  etiqueta?: string;
  created_at: string;
}

interface Props {
  informeId: string;
  visitaId: string;
  obraNombre: string;
  onBack: () => void;
  onRefresh: () => void;
}

export default function SeccionObservaciones({ informeId, visitaId, obraNombre, onBack, onRefresh }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Observacion[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingFoto, setViewingFoto] = useState<string | null>(null);
  const [showManualNote, setShowManualNote] = useState(false);
  const [manualNoteText, setManualNoteText] = useState('');

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

    const fotoCount = items.filter(i => i.foto_url).length;
    const etiqueta = `Observaciones - Foto ${fotoCount + 1} | ${obraNombre} | ${format(new Date(), "dd MMM yyyy, HH:mm", { locale: es })}`;

    const { error } = await supabase.from('observaciones').insert({
      informe_id: informeId,
      texto: '',
      foto_url: urlData.publicUrl,
      etiqueta,
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

  const saveManualNote = async () => {
    if (!manualNoteText.trim()) return;

    const { error } = await supabase.from('observaciones').insert({
      informe_id: informeId,
      texto: manualNoteText.trim(),
    });

    if (error) { toast.error('Error al guardar'); return; }
    toast.success('Observación guardada');
    setManualNoteText('');
    setShowManualNote(false);
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

      <div className="space-y-1">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <ChevronLeft className="h-4 w-4" />
          {obraNombre}
        </button>
        <h2 className="font-heading text-xl font-bold">Observaciones</h2>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button onClick={handlePhotoCapture} className="field-action-btn">
          <Camera className="h-7 w-7 text-primary" />
          <span className="label">Foto</span>
        </button>
        <button onClick={voice.openDialog} className="field-action-btn">
          <Mic className="h-7 w-7 text-primary" />
          <span className="label">Nota por voz</span>
        </button>
        <button onClick={() => setShowManualNote(true)} className="field-action-btn">
          <StickyNote className="h-7 w-7 text-primary" />
          <span className="label">Nota</span>
        </button>
      </div>

      {showManualNote && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Textarea
            value={manualNoteText}
            onChange={(e) => setManualNoteText(e.target.value)}
            placeholder="Escribe la observación..."
            className="min-h-[80px] text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={saveManualNote} className="flex-1">Guardar</Button>
            <Button size="sm" variant="outline" onClick={() => { setShowManualNote(false); setManualNoteText(''); }} className="flex-1">Cancelar</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-heading text-sm font-semibold">Observaciones ({items.length})</h3>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Sin observaciones aún.<br />Usa los botones de arriba para añadir.</p>
          </div>
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
                  <>
                    <img src={item.foto_url} alt="Foto" className="w-full max-h-[400px] rounded-lg object-contain bg-muted/50 border border-border cursor-pointer" onClick={() => setViewingFoto(item.foto_url)} />
                    <p className="text-[11px] text-muted-foreground text-center mt-1">{format(new Date(item.created_at), "dd MMM yyyy, HH:mm", { locale: es })}</p>
                  </>
                )}
                {editingId === item.id ? (
                  <EditableTextWithAI
                    value={editText}
                    onChange={setEditText}
                    onSave={saveEdit}
                    onCancel={() => setEditingId(null)}
                    categoria="Observación general en visita de obra"
                  />
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
        isImproving={voice.isImproving}
        onStartRecording={voice.startRecording}
        onStopRecording={voice.stopRecording}
        onFinishRecording={voice.finishRecording}
        onImproveWithAI={(texto) => voice.improveText(texto)}
        onSave={saveVoiceNote}
        onRepeat={voice.openDialog}
      />

      <FotoViewer url={viewingFoto} onClose={() => setViewingFoto(null)} editable onSave={async (newUrl) => {
        const item = items.find(i => i.foto_url === viewingFoto);
        if (item) await supabase.from('observaciones').update({ foto_url: newUrl }).eq('id', item.id);
        setViewingFoto(null);
        await fetchItems();
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
