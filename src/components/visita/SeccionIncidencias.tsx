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

interface Incidencia {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  normativa: string;
  fotos: { id: string; url: string; etiqueta?: string; created_at: string }[];
  created_at: string;
}

interface Props {
  informeId: string;
  visitaId: string;
  obraNombre: string;
  onBack: () => void;
  onRefresh: () => void;
}

export default function SeccionIncidencias({ informeId, visitaId, obraNombre, onBack, onRefresh }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingFoto, setViewingFoto] = useState<string | null>(null);
  const [showManualNote, setShowManualNote] = useState(false);
  const [manualNoteText, setManualNoteText] = useState('');

  const voice = useVoiceNote('Incidencias de seguridad');

  const fetchIncidencias = async () => {
    const { data } = await supabase
      .from('incidencias')
      .select('id, titulo, descripcion, categoria, normativa, created_at, fotos(id, url, etiqueta, created_at)')
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

    const { count: fotoCount } = await supabase
      .from('fotos')
      .select('id', { count: 'exact', head: true })
      .in('incidencia_id', (await supabase.from('incidencias').select('id').eq('informe_id', informeId)).data?.map(i => i.id) || []);

    const etiqueta = `Incidencias - Foto ${(fotoCount || 0) + 1} | ${obraNombre} | ${format(new Date(), "dd MMM yyyy, HH:mm", { locale: es })}`;

    const { data: inc, error: incError } = await supabase
      .from('incidencias')
      .insert({ informe_id: informeId, titulo: 'Incidencia con foto', categoria: 'general', descripcion: '' })
      .select('id')
      .single();

    if (incError || !inc) { console.error('Insert incidencia (foto):', incError); toast.error('Error al crear incidencia'); setUploading(false); return; }

    await supabase.from('fotos').insert({ incidencia_id: inc.id, url: urlData.publicUrl, etiqueta });

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

  const saveManualNote = async () => {
    if (!manualNoteText.trim()) return;

    const { error } = await supabase.from('incidencias').insert({
      informe_id: informeId,
      titulo: manualNoteText.trim().slice(0, 60),
      categoria: 'general',
      descripcion: manualNoteText.trim(),
    });

    if (error) { toast.error('Error al guardar'); return; }
    toast.success('Incidencia guardada');
    setManualNoteText('');
    setShowManualNote(false);
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

      <div className="space-y-1">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <ChevronLeft className="h-4 w-4" />
          {obraNombre}
        </button>
        <h2 className="font-heading text-xl font-bold">Incidencias</h2>
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
            placeholder="Escribe la incidencia..."
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
        <h3 className="font-heading text-sm font-semibold">Incidencias ({incidencias.length})</h3>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : incidencias.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Sin incidencias aún.<br />Usa los botones de arriba para añadir.</p>
          </div>
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
                  <div key={f.id}>
                    <img src={f.url} alt="Foto" className="w-full max-h-[400px] rounded-lg object-contain bg-muted/50 border border-border cursor-pointer" onClick={() => setViewingFoto(f.url)} />
                    <p className="text-[11px] text-muted-foreground text-center mt-1">{format(new Date(f.created_at), "dd MMM yyyy, HH:mm", { locale: es })}</p>
                  </div>
                ))}
                {editingId === inc.id ? (
                  <EditableTextWithAI
                    value={editText}
                    onChange={setEditText}
                    onSave={saveEdit}
                    onCancel={() => setEditingId(null)}
                    categoria="Incidencia de seguridad en obra"
                  />
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
        isImproving={voice.isImproving}
        onStartRecording={voice.startRecording}
        onStopRecording={voice.stopRecording}
        onFinishRecording={voice.finishRecording}
        onImproveWithAI={(texto) => voice.improveText(texto)}
        onSave={saveVoiceNote}
        onRepeat={voice.openDialog}
      />

      <FotoViewer url={viewingFoto} onClose={() => setViewingFoto(null)} editable onSave={async (newUrl) => {
        for (const inc of incidencias) {
          const foto = inc.fotos.find(f => f.url === viewingFoto);
          if (foto) { await supabase.from('fotos').update({ url: newUrl }).eq('id', foto.id); break; }
        }
        setViewingFoto(null);
        await fetchIncidencias();
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
