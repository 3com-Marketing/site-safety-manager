import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, Loader2, Clock, MapPin, AlertTriangle, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, isAfter, format, differenceInSeconds } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import VisitaSecciones, { type SeccionId } from '@/components/visita/VisitaSecciones';
import ChecklistBloque from '@/components/visita/ChecklistBloque';
import SeccionIncidencias from '@/components/visita/SeccionIncidencias';
import SeccionAmonestaciones from '@/components/visita/SeccionAmonestaciones';
import SeccionObservaciones from '@/components/visita/SeccionObservaciones';
import SeccionDatosGenerales from '@/components/visita/SeccionDatosGenerales';
import MapPicker from '@/components/MapPicker';
import { haversineDistance, formatDistance } from '@/lib/geo';

type FinishGeoErrorKind = 'denied' | 'unavailable' | 'timeout';
type FinishGeoState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'error'; kind: FinishGeoErrorKind }
  | { status: 'confirm'; lat: number; lng: number; obraLat: number; obraLng: number; distance: number }
  | { status: 'saving' };

const BLOQUE_LABELS: Record<string, string> = {
  EPIs: 'EPIs',
  orden_limpieza: 'Orden y limpieza',
  altura: 'Trabajo en altura',
  señalizacion: 'Señalización',
  maquinaria: 'Maquinaria',
};

const CATEGORIAS_ORDER = ['EPIs', 'orden_limpieza', 'altura', 'señalizacion', 'maquinaria'];

type StepId = SeccionId;

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
  const location = useLocation();
  const { user } = useAuth();
  const isAdminMode = location.pathname.startsWith('/admin/');

  const [informeId, setInformeId] = useState<string | null>(null);
  const [obraNombre, setObraNombre] = useState('');
  const [obraLat, setObraLat] = useState<number | null>(null);
  const [obraLng, setObraLng] = useState<number | null>(null);
  const [bloques, setBloques] = useState<BloqueData[]>([]);
  const [incidenciasCount, setIncidenciasCount] = useState(0);
  const [amonestacionesCount, setAmonestacionesCount] = useState(0);
  const [observacionesCount, setObservacionesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finishGeo, setFinishGeo] = useState<FinishGeoState>({ status: 'idle' });
  const [view, setView] = useState<ViewState>({ type: 'secciones' });
  const [isFinalized, setIsFinalized] = useState(false);
  const [editableUntil, setEditableUntil] = useState<Date | null>(null);
  const [fechaInicio, setFechaInicio] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const finishing = finishGeo.status !== 'idle';

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
      .select('id, estado, fecha, obras(nombre, latitud, longitud)')
      .eq('id', id)
      .single();

    if (!visita) {
      navigate(isAdminMode ? '/admin' : '/');
      return;
    }

    if (visita.estado === 'finalizada') {
      const deadline = addDays(new Date(visita.fecha), 7);
      if (!isAfter(deadline, new Date()) && !isAdminMode) {
        navigate('/');
        return;
      }
      setIsFinalized(true);
      setEditableUntil(deadline);
    }

    setFechaInicio(visita.fecha);
    const obra: any = (visita as any).obras;
    setObraNombre(obra?.nombre || 'Obra');
    setObraLat(obra?.latitud ?? null);
    setObraLng(obra?.longitud ?? null);

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
    setAmonestacionesCount(amonCount || 0);

    const { count: obsCount } = await supabase
      .from('observaciones')
      .select('id', { count: 'exact', head: true })
      .eq('informe_id', informe.id);
    setObservacionesCount(obsCount || 0);

    setLoading(false);
  }, [id, navigate, isAdminMode]);

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

  // Elapsed timer
  useEffect(() => {
    if (!fechaInicio || isFinalized) return;
    const update = () => setElapsed(differenceInSeconds(new Date(), new Date(fechaInicio)));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [fechaInicio, isFinalized]);

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const finishVisita = async () => {
    if (!id || !informeId) return;
    setFinishing(true);
    setGettingGeo(true);

    let lat_fin: number | null = null;
    let lng_fin: number | null = null;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });
        lat_fin = pos.coords.latitude;
        lng_fin = pos.coords.longitude;
      } catch {
        // GPS denied
      }
    }

    setGettingGeo(false);

    await supabase.from('visitas').update({ estado: 'finalizada', lat_fin, lng_fin, fecha_fin: new Date().toISOString() } as any).eq('id', id);
    await supabase.from('informes').update({ estado: 'pendiente_revision' }).eq('id', informeId);
    toast.success('Visita finalizada');
    navigate(isAdminMode ? '/admin' : '/');
  };

  const handleSelectSeccion = (seccionId: SeccionId) => {
    setView({ type: 'step', stepId: seccionId });
  };

  const handleBack = () => {
    setView({ type: 'secciones' });
  };

  // Build completion map for VisitaSecciones
  const completadas: Record<string, boolean> = {
    datos_generales: false, // datos generales doesn't have a "completed" state for now
  };
  bloques.forEach(b => {
    completadas[`bloque_${b.categoria}`] = b.estado === 'completado';
  });
  completadas.incidencias = incidenciasCount > 0;
  completadas.amonestaciones = amonestacionesCount > 0;
  completadas.observaciones = observacionesCount > 0;

  const handleMarcarCompletado = async (bloqueId: string) => {
    const bloque = bloques.find(b => b.id === bloqueId);
    if (!bloque) return;
    const newEstado = bloque.estado === 'completado' ? 'pendiente' : 'completado';
    await supabase.from('checklist_bloques').update({ estado: newEstado }).eq('id', bloqueId);
    toast.success(newEstado === 'completado' ? 'Sección marcada como completada' : 'Sección desmarcada');
    fetchData();
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

  const prevStepLabel = view.type === 'step' && currentStepIndex > 0
    ? STEP_LABELS[STEPS[currentStepIndex - 1]]
    : undefined;

  const nextStepLabel = view.type === 'step' && currentStepIndex < STEPS.length - 1
    ? STEP_LABELS[STEPS[currentStepIndex + 1]]
    : undefined;

  return (
    <div className="min-h-screen bg-background pb-32 sm:pb-36">
      <header className="sticky top-0 z-10 border-b border-border bg-card px-3 sm:px-4 py-2 sm:py-3">
        {view.type === 'secciones' ? (
          <div>
            <button onClick={() => navigate(isAdminMode ? '/admin' : '/')} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline mb-0.5">
              <ChevronLeft className="h-4 w-4" />
              Visitas
            </button>
            <h1 className="font-heading text-lg font-bold">{obraNombre}</h1>
            <p className="text-xs text-muted-foreground">
              {isFinalized && editableUntil
                ? `Finalizada · Editable hasta ${format(editableUntil, "dd MMM yyyy", { locale: es })}`
                : (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    En visita: {formatElapsed(elapsed)}
                  </span>
                )}
            </p>
          </div>
        ) : (
          <div>
            <button onClick={handleBack} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline mb-0.5">
              <ChevronLeft className="h-4 w-4" />
              {obraNombre}
            </button>
            <h1 className="font-heading text-base font-bold">
              {view.type === 'step' ? STEP_LABELS[view.stepId] : ''}
            </h1>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-2xl p-3 sm:p-4">
        {view.type === 'secciones' && (
          <VisitaSecciones
            onSelect={handleSelectSeccion}
            completadas={completadas}
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
            bloqueEstado={currentBloque.estado}
            onMarcarCompletado={() => handleMarcarCompletado(currentBloque.id)}
            prevSeccionLabel={prevStepLabel}
            onPrevSeccion={currentStepIndex > 0 ? goPrev : undefined}
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

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-3 sm:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-4">
        <div className="mx-auto max-w-2xl">
          {view.type === 'secciones' ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(isAdminMode ? '/admin' : '/')}
                className={`h-14 ${isFinalized || isAdminMode ? 'w-full' : 'flex-1'} text-base font-semibold gap-2`}
              >
                <ArrowLeft className="h-5 w-5" />
                {isAdminMode ? 'Volver a admin' : 'Guardar y salir'}
              </Button>
              {!isFinalized && !isAdminMode && (
                <Button
                  onClick={finishVisita}
                  disabled={finishing}
                  variant="default"
                  className="h-14 flex-1 text-base font-bold gap-2 bg-success hover:bg-success/90 text-success-foreground"
                >
                  {finishing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
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
                  {prevStepLabel || 'Anterior'}
                </Button>
                {!isLastStep ? (
                  <Button
                    onClick={goNext}
                    className="h-12 flex-1 text-sm font-semibold gap-1"
                  >
                    {nextStepLabel || 'Siguiente'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : !isFinalized && !isAdminMode ? (
                  <Button
                    onClick={finishVisita}
                    disabled={finishing}
                    className="h-12 flex-1 text-sm font-bold gap-1 bg-success hover:bg-success/90 text-success-foreground"
                  >
                    {finishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
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
              {!isLastStep && !isFinalized && !isAdminMode && (
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

      <Dialog open={gettingGeo}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader>
            <DialogTitle>Obteniendo ubicación de cierre</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Registrando tu ubicación final...</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
