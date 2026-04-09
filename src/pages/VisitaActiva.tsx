import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Camera,
  MessageSquare,
  CheckSquare,
  Check,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIAS = [
  { value: 'EPIs', label: 'EPIs' },
  { value: 'orden_limpieza', label: 'Orden y limpieza' },
  { value: 'altura', label: 'Trabajo en altura' },
  { value: 'señalizacion', label: 'Señalización' },
  { value: 'maquinaria', label: 'Maquinaria' },
];

interface Incidencia {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  orden: number;
  fotos: { id: string; url: string }[];
}

export default function VisitaActiva() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [informeId, setInformeId] = useState<string | null>(null);
  const [obraNombre, setObraNombre] = useState('');
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  // Dialog states
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);

  // Form state
  const [textoTitulo, setTextoTitulo] = useState('');
  const [textoDesc, setTextoDesc] = useState('');
  const [selectedIncidenciaForPhoto, setSelectedIncidenciaForPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    if (!id) return;

    // Get visita + obra
    const { data: visita } = await supabase
      .from('visitas')
      .select('id, estado, obras(nombre)')
      .eq('id', id)
      .single();

    if (!visita || visita.estado === 'finalizada') {
      navigate('/');
      return;
    }

    setObraNombre((visita as any).obras?.nombre || 'Obra');

    // Get informe
    const { data: informe } = await supabase
      .from('informes')
      .select('id')
      .eq('visita_id', id)
      .single();

    if (informe) {
      setInformeId(informe.id);

      // Get incidencias with fotos
      const { data: incs } = await supabase
        .from('incidencias')
        .select('id, titulo, descripcion, categoria, orden, fotos(id, url)')
        .eq('informe_id', informe.id)
        .order('orden');

      setIncidencias(
        (incs || []).map((inc: any) => ({
          ...inc,
          fotos: inc.fotos || [],
        }))
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const createIncidencia = async (titulo: string, descripcion: string, categoria: string) => {
    if (!informeId) return;
    const { error } = await supabase.from('incidencias').insert({
      informe_id: informeId,
      titulo,
      descripcion,
      categoria,
      orden: incidencias.length,
    });
    if (error) {
      toast.error('Error al crear incidencia');
      return;
    }
    toast.success('Incidencia creada');
    await fetchData();
  };

  const handleTextSubmit = async () => {
    if (!textoTitulo.trim()) return;
    await createIncidencia(textoTitulo.trim(), textoDesc.trim(), 'EPIs');
    setTextoTitulo('');
    setTextoDesc('');
    setShowTextDialog(false);
  };

  const handleChecklistItem = async (cat: typeof CATEGORIAS[0]) => {
    await createIncidencia(`Incidencia: ${cat.label}`, `Detectada incidencia en categoría ${cat.label}`, cat.value);
    setShowChecklistDialog(false);
  };

  const handlePhotoCapture = () => {
    if (incidencias.length === 0) {
      // Create incidencia first, then add photo
      setShowPhotoDialog(true);
    } else {
      // Show selector for which incidencia to attach
      setShowPhotoDialog(true);
    }
  };

  const triggerFileInput = (incidenciaId: string) => {
    setSelectedIncidenciaForPhoto(incidenciaId);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedIncidenciaForPhoto) return;
    setUploading(true);

    const ext = file.name.split('.').pop();
    const path = `${id}/${Date.now()}.${ext}`;

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

    await supabase.from('fotos').insert({
      incidencia_id: selectedIncidenciaForPhoto,
      url: urlData.publicUrl,
    });

    toast.success('Foto añadida');
    setUploading(false);
    setShowPhotoDialog(false);
    setSelectedIncidenciaForPhoto(null);
    e.target.value = '';
    await fetchData();
  };

  const handleQuickPhotoIncidencia = async () => {
    if (!informeId) return;
    // Create a new incidencia and immediately trigger photo
    const { data, error } = await supabase.from('incidencias').insert({
      informe_id: informeId,
      titulo: 'Incidencia con foto',
      descripcion: '',
      categoria: 'EPIs',
      orden: incidencias.length,
    }).select('id').single();

    if (error || !data) {
      toast.error('Error');
      return;
    }
    await fetchData();
    setSelectedIncidenciaForPhoto(data.id);
    setShowPhotoDialog(false);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const deleteIncidencia = async (incId: string) => {
    await supabase.from('incidencias').delete().eq('id', incId);
    toast.success('Incidencia eliminada');
    await fetchData();
  };

  const finishVisita = async () => {
    if (!id || !informeId) return;
    setFinishing(true);
    await supabase.from('visitas').update({ estado: 'finalizada' }).eq('id', id);
    await supabase.from('informes').update({ estado: 'pendiente_revision' }).eq('id', informeId);
    toast.success('Visita finalizada');
    navigate('/');
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Cargando...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-32">
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
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="font-heading text-base font-bold truncate">{obraNombre}</h1>
          <p className="text-xs text-muted-foreground">Visita en progreso</p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl p-4 space-y-6">
        {/* 3 big action buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button onClick={handlePhotoCapture} className="field-action-btn">
            <span className="icon">📷</span>
            <span className="label">Foto</span>
          </button>
          <button onClick={() => setShowTextDialog(true)} className="field-action-btn">
            <span className="icon">🎤</span>
            <span className="label">Texto</span>
          </button>
          <button onClick={() => setShowChecklistDialog(true)} className="field-action-btn">
            <span className="icon">✔</span>
            <span className="label">Checklist</span>
          </button>
        </div>

        {/* Incidencias list */}
        <div className="space-y-3">
          <h2 className="font-heading text-base font-semibold">
            Incidencias ({incidencias.length})
          </h2>

          {incidencias.length === 0 ? (
            <p className="text-sm text-muted-foreground">Usa los botones de arriba para crear incidencias</p>
          ) : (
            <div className="space-y-2">
              {incidencias.map((inc, idx) => (
                <div key={inc.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-semibold">{inc.titulo}</p>
                      {inc.descripcion && (
                        <p className="text-xs text-muted-foreground mt-1">{inc.descripcion}</p>
                      )}
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {CATEGORIAS.find(c => c.value === inc.categoria)?.label || inc.categoria}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => triggerFileInput(inc.id)}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteIncidencia(inc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {inc.fotos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto py-1">
                      {inc.fotos.map(f => (
                        <img
                          key={f.id}
                          src={f.url}
                          alt="Foto incidencia"
                          className="h-20 w-20 shrink-0 rounded-lg object-cover border border-border"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Finish button - sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-4">
        <div className="mx-auto max-w-2xl">
          <Button
            onClick={finishVisita}
            disabled={finishing}
            variant="default"
            className="h-14 w-full text-base font-bold gap-2 bg-success hover:bg-success/90 text-success-foreground"
          >
            <Check className="h-5 w-5" />
            {finishing ? 'Finalizando...' : 'FINALIZAR VISITA'}
          </Button>
        </div>
      </div>

      {/* Text Dialog */}
      <Dialog open={showTextDialog} onOpenChange={setShowTextDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Añadir incidencia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Título de la incidencia"
              value={textoTitulo}
              onChange={e => setTextoTitulo(e.target.value)}
              className="h-12 text-base"
            />
            <Textarea
              placeholder="Descripción (opcional)"
              value={textoDesc}
              onChange={e => setTextoDesc(e.target.value)}
              className="min-h-[100px] text-base"
            />
            <Button onClick={handleTextSubmit} className="h-12 w-full text-base font-semibold" disabled={!textoTitulo.trim()}>
              Crear incidencia
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checklist Dialog */}
      <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Checklist rápido</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {CATEGORIAS.map(cat => (
              <button
                key={cat.value}
                onClick={() => handleChecklistItem(cat)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
              >
                <CheckSquare className="h-5 w-5 text-primary shrink-0" />
                <span className="font-heading font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Dialog - select incidencia or create new */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Añadir foto</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <button
              onClick={handleQuickPhotoIncidencia}
              className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10"
            >
              <Camera className="h-5 w-5 text-primary shrink-0" />
              <span className="font-heading font-medium text-sm">Nueva incidencia con foto</span>
            </button>
            {incidencias.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground pt-2">O añadir foto a incidencia existente:</p>
                {incidencias.map(inc => (
                  <button
                    key={inc.id}
                    onClick={() => triggerFileInput(inc.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50"
                  >
                    <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{inc.titulo}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
