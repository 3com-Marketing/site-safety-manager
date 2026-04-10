import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Camera, MessageSquare, Trash2 } from 'lucide-react';
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

export default function ChecklistBloque({
  bloqueId,
  categoria,
  categoriaLabel,
  estado,
  anotaciones,
  visitaId,
  onBack,
  onRefresh,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteText, setNoteText] = useState('');

  const updateEstado = async (newEstado: string) => {
    const { error } = await supabase
      .from('checklist_bloques')
      .update({ estado: newEstado })
      .eq('id', bloqueId);
    if (error) {
      toast.error('Error al actualizar estado');
      return;
    }
    onRefresh();
  };

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

  const handleNoteSubmit = async () => {
    if (!noteText.trim()) return;
    const { error } = await supabase.from('anotaciones').insert({
      bloque_id: bloqueId,
      texto: noteText.trim(),
    });
    if (error) {
      toast.error('Error al guardar nota');
      return;
    }
    toast.success('Nota añadida');
    setNoteText('');
    setShowNoteDialog(false);
    onRefresh();
  };

  const deleteAnotacion = async (anotacionId: string) => {
    await supabase.from('anotaciones').delete().eq('id', anotacionId);
    toast.success('Anotación eliminada');
    onRefresh();
  };

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

      {/* Estado general */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Estado general</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateEstado('correcto')}
            className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-4 font-heading font-semibold text-base transition-all active:scale-95 ${
              estado === 'correcto'
                ? 'border-success bg-success/10 text-success'
                : 'border-border bg-card text-foreground hover:border-success/50'
            }`}
          >
            ✓ Correcto
          </button>
          <button
            onClick={() => updateEstado('incorrecto')}
            className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-4 font-heading font-semibold text-base transition-all active:scale-95 ${
              estado === 'incorrecto'
                ? 'border-destructive bg-destructive/10 text-destructive'
                : 'border-border bg-card text-foreground hover:border-destructive/50'
            }`}
          >
            ✗ Incorrecto
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handlePhotoCapture} className="field-action-btn">
          <span className="icon">📷</span>
          <span className="label">Foto</span>
        </button>
        <button onClick={() => setShowNoteDialog(true)} className="field-action-btn">
          <span className="icon">📝</span>
          <span className="label">Nota</span>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive shrink-0"
                    onClick={() => deleteAnotacion(a.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {a.foto_url && (
                  <img
                    src={a.foto_url}
                    alt="Foto anotación"
                    className="w-full max-h-48 rounded-lg object-cover border border-border"
                  />
                )}
                {a.texto && (
                  <p className="text-sm text-foreground">{a.texto}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Añadir nota</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Escribe tu observación..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[120px] text-base"
            />
            <Button
              onClick={handleNoteSubmit}
              className="h-12 w-full text-base font-semibold"
              disabled={!noteText.trim()}
            >
              Guardar nota
            </Button>
          </div>
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
