import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import VisitaSecciones, { type SeccionId } from '@/components/visita/VisitaSecciones';
import ChecklistSection from '@/components/visita/ChecklistSection';
import type { BloqueCategoria } from '@/components/visita/ChecklistSection';
import ChecklistBloque from '@/components/visita/ChecklistBloque';
import SeccionIncidencias from '@/components/visita/SeccionIncidencias';
import SeccionAmonestaciones from '@/components/visita/SeccionAmonestaciones';
import SeccionObservaciones from '@/components/visita/SeccionObservaciones';
import SeccionDatosGenerales from '@/components/visita/SeccionDatosGenerales';

const BLOQUE_LABELS: Record<string, string> = {
  EPIs: 'EPIs',
  orden_limpieza: 'Orden y limpieza',
  altura: 'Trabajo en altura',
  señalizacion: 'Señalización',
  maquinaria: 'Maquinaria',
};

const CATEGORIAS_ORDER = ['EPIs', 'orden_limpieza', 'altura', 'señalizacion', 'maquinaria'];

interface BloqueData {
  id: string;
  categoria: string;
  estado: string;
  anotaciones: { id: string; texto: string; normativa?: string; foto_url: string | null; created_at: string }[];
}

type ViewState =
  | { type: 'secciones' }
  | { type: 'seccion'; seccionId: SeccionId }
  | { type: 'bloque'; bloqueCategoria: BloqueCategoria };

export default function VisitaActiva() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [informeId, setInformeId] = useState<string | null>(null);
  const [obraNombre, setObraNombre] = useState('');
  const [bloques, setBloques] = useState<BloqueData[]>([]);
  const [incidenciasCount, setIncidenciasCount] = useState(0);
  const [amonestacionesCount, setAmonestacionesCount] = useState(0);
  const [observacionesCount, setObservacionesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [view, setView] = useState<ViewState>({ type: 'secciones' });

  const fetchData = useCallback(async () => {
    if (!id) return;

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

    const { data: informe } = await supabase
      .from('informes')
      .select('id')
      .eq('visita_id', id)
      .single();

    if (!informe) {
      setLoading(false);
      return;
    }

    setInformeId(informe.id);

    await ensureBloques(informe.id);

    const { data: bloquesData } = await supabase
      .from('checklist_bloques')
      .select('id, categoria, estado, anotaciones(id, texto, normativa, foto_url, created_at)')
      .eq('informe_id', informe.id)
      .order('created_at');

    setBloques(
      (bloquesData || []).map((b: any) => ({
        ...b,
        anotaciones: (b.anotaciones || []).sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      }))
    );

    // Counts for badges
    const { count: incCount } = await supabase
      .from('incidencias')
      .select('id', { count: 'exact', head: true })
      .eq('informe_id', informe.id);
    setIncidenciasCount(incCount || 0);

    const { count: amonCount } = await supabase
      .from('amonestaciones')
      .select('id', { count: 'exact', head: true })
      .eq('informe_id', informe.id);
    setAmonestacionesCount(amonCount || 0);

    const { count: obsCount } = await supabase
      .from('observaciones')
      .select('id', { count: 'exact', head: true })
      .eq('informe_id', informe.id);
    setObservacionesCount(obsCount || 0);

    setLoading(false);
  }, [id, navigate]);

  const ensureBloques = async (informeId: string) => {
    const { data: existing } = await supabase
      .from('checklist_bloques')
      .select('categoria')
      .eq('informe_id', informeId);

    const existingCats = new Set((existing || []).map((b: any) => b.categoria));
    const missing = CATEGORIAS_ORDER.filter(c => !existingCats.has(c));

    if (missing.length > 0) {
      await supabase.from('checklist_bloques').insert(
        missing.map(cat => ({ informe_id: informeId, categoria: cat, estado: 'pendiente' }))
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const finishVisita = async () => {
    if (!id || !informeId) return;
    setFinishing(true);
    await supabase.from('visitas').update({ estado: 'finalizada' }).eq('id', id);
    await supabase.from('informes').update({ estado: 'pendiente_revision' }).eq('id', informeId);
    toast.success('Visita finalizada');
    navigate('/');
  };

  const handleSelectSeccion = (seccionId: SeccionId) => {
    setView({ type: 'seccion', seccionId });
  };

  const handleSelectBloque = (cat: BloqueCategoria) => {
    setView({ type: 'bloque', bloqueCategoria: cat });
  };

  const handleBack = () => {
    if (view.type === 'bloque') {
      setView({ type: 'seccion', seccionId: 'checklist' });
    } else {
      setView({ type: 'secciones' });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const currentBloque = view.type === 'bloque'
    ? bloques.find(b => b.categoria === view.bloqueCategoria)
    : null;

  const checklistAnotacionesTotal = bloques.reduce((sum, b) => sum + b.anotaciones.length, 0);

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        {view.type !== 'secciones' ? (
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="font-heading text-base font-bold truncate">{obraNombre}</h1>
          <p className="text-xs text-muted-foreground">Visita en progreso</p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl p-4">
        {view.type === 'secciones' && (
          <VisitaSecciones
            onSelect={handleSelectSeccion}
            checklistCount={checklistAnotacionesTotal}
            incidenciasCount={incidenciasCount}
            amonestacionesCount={amonestacionesCount}
            observacionesCount={observacionesCount}
          />
        )}

        {view.type === 'seccion' && view.seccionId === 'checklist' && (
          <ChecklistSection
            bloqueEstados={bloques.map(b => ({
              categoria: b.categoria,
              anotacionesCount: b.anotaciones.length,
            }))}
            onSelectBloque={handleSelectBloque}
            onBack={handleBack}
          />
        )}

        {view.type === 'bloque' && currentBloque && (
          <ChecklistBloque
            bloqueId={currentBloque.id}
            categoria={currentBloque.categoria}
            categoriaLabel={BLOQUE_LABELS[currentBloque.categoria] || currentBloque.categoria}
            anotaciones={currentBloque.anotaciones}
            visitaId={id!}
            onBack={handleBack}
            onRefresh={fetchData}
          />
        )}

        {view.type === 'seccion' && view.seccionId === 'datos_generales' && informeId && (
          <SeccionDatosGenerales informeId={informeId} onBack={handleBack} />
        )}

        {view.type === 'seccion' && view.seccionId === 'incidencias' && informeId && (
          <SeccionIncidencias informeId={informeId} visitaId={id!} onBack={handleBack} onRefresh={fetchData} />
        )}

        {view.type === 'seccion' && view.seccionId === 'amonestaciones' && informeId && (
          <SeccionAmonestaciones informeId={informeId} visitaId={id!} onBack={handleBack} onRefresh={fetchData} />
        )}

        {view.type === 'seccion' && view.seccionId === 'observaciones' && informeId && (
          <SeccionObservaciones informeId={informeId} visitaId={id!} onBack={handleBack} onRefresh={fetchData} />
        )}
      </div>

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
    </div>
  );
}
