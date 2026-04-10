import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Home, Info } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, isAfter, format } from 'date-fns';
import { es } from 'date-fns/locale';
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

type StepId =
  | 'datos_generales'
  | 'bloque_EPIs'
  | 'bloque_orden_limpieza'
  | 'bloque_altura'
  | 'bloque_señalizacion'
  | 'bloque_maquinaria'
  | 'incidencias'
  | 'amonestaciones'
  | 'observaciones';

const STEPS: StepId[] = [
  'datos_generales',
  'bloque_EPIs',
  'bloque_orden_limpieza',
  'bloque_altura',
  'bloque_señalizacion',
  'bloque_maquinaria',
  'incidencias',
  'amonestaciones',
  'observaciones',
];

const STEP_LABELS: Record<StepId, string> = {
  datos_generales: 'Datos generales',
  bloque_EPIs: 'EPIs',
  bloque_orden_limpieza: 'Orden y limpieza',
  bloque_altura: 'Trabajo en altura',
  bloque_señalizacion: 'Señalización',
  bloque_maquinaria: 'Maquinaria',
  incidencias: 'Incidencias',
  amonestaciones: 'Amonestaciones',
  observaciones: 'Observaciones',
};

interface BloqueData {
  id: string;
  categoria: string;
  estado: string;
  anotaciones: { id: string; texto: string; normativa?: string; foto_url: string | null; created_at: string }[];
}

type ViewState =
  | { type: 'secciones' }
  | { type: 'step'; stepId: StepId };

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
  const [isFinalized, setIsFinalized] = useState(false);
  const [editableUntil, setEditableUntil] = useState<Date | null>(null);

  const currentStepIndex = view.type === 'step' ? STEPS.indexOf(view.stepId) : -1;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const goNext = useCallback(() => {
    if (view.type !== 'step') return;
    const idx = STEPS.indexOf(view.stepId);
    if (idx < STEPS.length - 1) {
      setView({ type: 'step', stepId: STEPS[idx + 1] });
    }
  }, [view]);

  const goPrev = useCallback(() => {
    if (view.type !== 'step') return;
    const idx = STEPS.indexOf(view.stepId);
    if (idx > 0) {
      setView({ type: 'step', stepId: STEPS[idx - 1] });
    }
  }, [view]);

  const fetchData = useCallback(async () => {
    if (!id) return;

    const { data: visita } = await supabase
      .from('visitas')
      .select('id, estado, fecha, obras(nombre)')
      .eq('id', id)
      .single();

    if (!visita) {
      navigate('/');
      return;
    }

    if (visita.estado === 'finalizada') {
      const deadline = addDays(new Date(visita.fecha), 7);
      if (!isAfter(deadline, new Date())) {
        navigate('/');
        return;
      }
      setIsFinalized(true);
      setEditableUntil(deadline);
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

    const { count: incCount } = await supabase
      .from('incidencias')
      .select('id', { count: 'exact', head: true })
      .eq('informe_id', informe.id);
    setIncidenciasCount(incCount || 0);

    const { count: amonCount } = await supabase
      .from('amonestaciones')
      .select('id', { count: 'exact', head: true })
      .eq('informe_id', informe.id);
    setAmonestacionesCount(amonestacionesCount || 0);

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
    const stepMap: Partial<Record<SeccionId, StepId>> = {
      datos_generales: 'datos_generales',
      incidencias: 'incidencias',
      amonestaciones: 'amonestaciones',
      observaciones: 'observaciones',
    };
    if (stepMap[seccionId]) {
      setView({ type: 'step', stepId: stepMap[seccionId]! });
    } else if (seccionId === 'checklist') {
      setView({ type: 'step', stepId: 'bloque_EPIs' });
    }
  };

  const handleSelectBloque = (cat: BloqueCategoria) => {
    setView({ type: 'step', stepId: `bloque_${cat}` as StepId });
  };

  const handleBack = () => {
    setView({ type: 'secciones' });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const currentBloque = view.type === 'step' && view.stepId.startsWith('bloque_')
    ? bloques.find(b => b.categoria === view.stepId.replace('bloque_', ''))
    : null;

  const checklistAnotacionesTotal = bloques.reduce((sum, b) => sum + b.anotaciones.length, 0);

  const currentStepLabel = view.type === 'step' ? STEP_LABELS[view.stepId] : '';
  const stepNumber = view.type === 'step' ? currentStepIndex + 1 : 0;

  return (
    <div className="min-h-screen bg-background pb-36">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button variant="ghost" size="icon" onClick={view.type === 'secciones' ? () => navigate('/') : handleBack}>
          {view.type === 'secciones' ? (
            <ArrowLeft className="h-5 w-5" />
          ) : (
            <Home className="h-5 w-5" />
          )}
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-base font-bold truncate">{obraNombre}</h1>
          {view.type === 'step' ? (
            <p className="text-xs text-muted-foreground">
              Paso {stepNumber} de {STEPS.length} · {currentStepLabel}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {isFinalized && editableUntil
                ? `Finalizada · Editable hasta ${format(editableUntil, "dd MMM yyyy", { locale: es })}`
                : 'Visita en progreso'}
            </p>
          )}
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

        {view.type === 'step' && view.stepId === 'datos_generales' && informeId && (
          <SeccionDatosGenerales informeId={informeId} onBack={handleBack} />
        )}

        {view.type === 'step' && view.stepId.startsWith('bloque_') && currentBloque && (
          <ChecklistBloque
            bloqueId={currentBloque.id}
            categoria={currentBloque.categoria}
            categoriaLabel={BLOQUE_LABELS[currentBloque.categoria] || currentBloque.categoria}
            anotaciones={currentBloque.anotaciones}
            visitaId={id!}
            obraNombre={obraNombre}
            onBack={handleBack}
            onRefresh={fetchData}
          />
        )}

        {view.type === 'step' && view.stepId === 'incidencias' && informeId && (
          <SeccionIncidencias informeId={informeId} visitaId={id!} obraNombre={obraNombre} onBack={handleBack} onRefresh={fetchData} />
        )}

        {view.type === 'step' && view.stepId === 'amonestaciones' && informeId && (
          <SeccionAmonestaciones informeId={informeId} visitaId={id!} obraNombre={obraNombre} onBack={handleBack} onRefresh={fetchData} />
        )}

        {view.type === 'step' && view.stepId === 'observaciones' && informeId && (
          <SeccionObservaciones informeId={informeId} visitaId={id!} obraNombre={obraNombre} onBack={handleBack} onRefresh={fetchData} />
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-4">
        <div className="mx-auto max-w-2xl">
          {view.type === 'secciones' ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className={`h-14 ${isFinalized ? 'w-full' : 'flex-1'} text-base font-semibold gap-2`}
              >
                <ArrowLeft className="h-5 w-5" />
                Guardar y salir
              </Button>
              {!isFinalized && (
                <Button
                  onClick={finishVisita}
                  disabled={finishing}
                  variant="default"
                  className="h-14 flex-1 text-base font-bold gap-2 bg-success hover:bg-success/90 text-success-foreground"
                >
                  <Check className="h-5 w-5" />
                  {finishing ? 'Finalizando...' : 'FINALIZAR VISITA'}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={goPrev}
                  disabled={isFirstStep}
                  className="h-12 flex-1 text-sm font-semibold gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Anterior
                </Button>
                {!isLastStep ? (
                  <Button
                    onClick={goNext}
                    className="h-12 flex-1 text-sm font-semibold gap-1"
                  >
                    Siguiente
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : !isFinalized ? (
                  <Button
                    onClick={finishVisita}
                    disabled={finishing}
                    className="h-12 flex-1 text-sm font-bold gap-1 bg-success hover:bg-success/90 text-success-foreground"
                  >
                    <Check className="h-4 w-4" />
                    {finishing ? 'Finalizando...' : 'FINALIZAR'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setView({ type: 'secciones' })}
                    className="h-12 flex-1 text-sm font-semibold gap-1"
                  >
                    Volver a secciones
                  </Button>
                )}
              </div>
              {!isLastStep && !isFinalized && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={finishVisita}
                  disabled={finishing}
                  className="text-xs text-muted-foreground h-8"
                >
                  <Check className="h-3 w-3 mr-1" />
                  {finishing ? 'Finalizando...' : 'Finalizar visita ahora'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
