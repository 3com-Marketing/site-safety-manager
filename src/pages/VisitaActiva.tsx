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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import VisitaSecciones, { type SeccionId } from '@/components/visita/VisitaSecciones';
import ChecklistBloque from '@/components/visita/ChecklistBloque';
import SeccionIncidencias from '@/components/visita/SeccionIncidencias';
import SeccionAmonestaciones from '@/components/visita/SeccionAmonestaciones';
import SeccionObservaciones from '@/components/visita/SeccionObservaciones';
import SeccionDatosGenerales from '@/components/visita/SeccionDatosGenerales';
import MapPicker from '@/components/MapPicker';
import FirmaPresenciaDialog from '@/components/visita/FirmaPresenciaDialog';
import { haversineDistance, formatDistance } from '@/lib/geo';

interface FirmasPresenciaResolved {
  responsableNombre: string;
  responsableCargo: string;
  responsableUrl: string;
  tecnicoUrl: string;
  firmasAt: string;
}

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
  const [datosGeneralesCompletos, setDatosGeneralesCompletos] = useState(false);
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
  const [showFirmas, setShowFirmas] = useState(false);
  const [firmasPayload, setFirmasPayload] = useState<FirmasPresenciaResolved | null>(null);
  const [tecnicoNombre, setTecnicoNombre] = useState('');
  const [firmaPerfilUrl, setFirmaPerfilUrl] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

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

    if (user) {
      const { data: tec } = await supabase
        .from('tecnicos')
        .select('nombre, apellidos, firma_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (tec) {
        setTecnicoNombre(`${tec.nombre || ''} ${tec.apellidos || ''}`.trim() || (user.email ?? ''));
        setFirmaPerfilUrl(tec.firma_url || null);
      } else {
        setTecnicoNombre(user.email ?? '');
      }
    }

    const { data: informe } = await supabase
      .from('informes')
      .select('id, num_trabajadores, condiciones_climaticas, empresas_presentes, notas_generales')
      .eq('visita_id', id)
      .single();

    if (!informe) {
      setLoading(false);
      return;
    }

    setInformeId(informe.id);
    setDatosGeneralesCompletos(
      informe.num_trabajadores != null ||
      !!(informe.condiciones_climaticas || '').trim() ||
      !!(informe.empresas_presentes || '').trim() ||
      !!(informe.notas_generales || '').trim()
    );

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
  }, [id, navigate, isAdminMode, user]);

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

  const persistFinish = async (lat: number | null, lng: number | null, firmas?: FirmasPresenciaResolved | null) => {
    if (!id || !informeId) return;
    const payload = firmas ?? firmasPayload;
    if (!payload) {
      toast.error('Faltan las firmas de presencia');
      setFinishGeo({ status: 'idle' });
      return;
    }
    setFinishGeo({ status: 'saving' });
    try {
      await supabase.from('visitas').update({
        estado: 'finalizada',
        lat_fin: lat,
        lng_fin: lng,
        fecha_fin: new Date().toISOString(),
        firma_responsable_url: payload.responsableUrl,
        firma_responsable_nombre: payload.responsableNombre,
        firma_responsable_cargo: payload.responsableCargo,
        firma_tecnico_url: payload.tecnicoUrl,
        firmas_at: payload.firmasAt,
      } as any).eq('id', id);
      await supabase.from('informes').update({ estado: 'pendiente_revision' }).eq('id', informeId);
      toast.success('Visita finalizada');
      navigate(isAdminMode ? '/admin' : '/');
    } catch (err) {
      console.error(err);
      toast.error('No se pudo finalizar la visita');
      setFinishGeo({ status: 'idle' });
    }
  };

  const startGeoFlow = async (firmas: FirmasPresenciaResolved) => {
    if (!id || !informeId) return;
    setFirmasPayload(firmas);

    if (!navigator.geolocation) {
      setFinishGeo({ status: 'error', kind: 'unavailable' });
      return;
    }

    try {
      // @ts-ignore
      if (navigator.permissions?.query) {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (status.state === 'denied') {
          setFinishGeo({ status: 'error', kind: 'denied' });
          return;
        }
      }
    } catch {
      // ignore
    }

    setFinishGeo({ status: 'requesting' });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const tecLat = pos.coords.latitude;
        const tecLng = pos.coords.longitude;
        if (obraLat != null && obraLng != null) {
          const dist = haversineDistance(tecLat, tecLng, obraLat, obraLng);
          setFinishGeo({ status: 'confirm', lat: tecLat, lng: tecLng, obraLat, obraLng, distance: dist });
        } else {
          persistFinish(tecLat, tecLng, firmas);
        }
      },
      (err) => {
        const kind: FinishGeoErrorKind =
          err.code === err.PERMISSION_DENIED ? 'denied' :
          err.code === err.TIMEOUT ? 'timeout' : 'unavailable';
        setFinishGeo({ status: 'error', kind });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  };

  /** Disparado por el botón FINALIZAR. Abre primero el diálogo de firmas. */
  const finishVisita = () => {
    if (!id || !informeId) return;
    if (firmasPayload) {
      // Si ya hay firmas (p.ej. usuario reintenta tras error GPS), salta directamente al GPS.
      startGeoFlow(firmasPayload);
      return;
    }
    setShowFirmas(true);
  };

  /** Sube los blobs y arranca el flujo de GPS con las firmas. */
  const handleFirmasConfirmed = async (payload: {
    responsableNombre: string;
    responsableCargo: string;
    responsableBlob: Blob;
    tecnicoUseStored?: boolean;
    tecnicoBlob?: Blob;
    firmasAt: string;
  }) => {
    if (!id) throw new Error('Sin visita');

    const ts = Date.now();
    // Subir firma del responsable (siempre nueva)
    const resPath = `firmas-visitas/${id}_responsable_${ts}.png`;
    const { error: resErr } = await supabase.storage.from('logos')
      .upload(resPath, payload.responsableBlob, { contentType: 'image/png', upsert: true });
    if (resErr) throw resErr;
    const resUrl = supabase.storage.from('logos').getPublicUrl(resPath).data.publicUrl;

    // Firma del técnico: o reutiliza la de perfil o sube la dibujada
    let tecUrl: string;
    if (payload.tecnicoUseStored && firmaPerfilUrl) {
      tecUrl = firmaPerfilUrl;
    } else if (payload.tecnicoBlob) {
      const tecPath = `firmas-visitas/${id}_tecnico_${ts}.png`;
      const { error: tecErr } = await supabase.storage.from('logos')
        .upload(tecPath, payload.tecnicoBlob, { contentType: 'image/png', upsert: true });
      if (tecErr) throw tecErr;
      tecUrl = supabase.storage.from('logos').getPublicUrl(tecPath).data.publicUrl;
    } else {
      throw new Error('Falta la firma del técnico');
    }

    const resolved: FirmasPresenciaResolved = {
      responsableNombre: payload.responsableNombre,
      responsableCargo: payload.responsableCargo,
      responsableUrl: resUrl,
      tecnicoUrl: tecUrl,
      firmasAt: payload.firmasAt,
    };

    setShowFirmas(false);
    await startGeoFlow(resolved);
  };

  const handleSelectSeccion = (seccionId: SeccionId) => {
    setView({ type: 'step', stepId: seccionId });
  };

  const handleBack = () => {
    setView({ type: 'secciones' });
  };

  // Build completion map for VisitaSecciones
  const completadas: Record<string, boolean> = {
    datos_generales: datosGeneralesCompletos,
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
          <SeccionDatosGenerales informeId={informeId} onBack={handleBack} onSaved={fetchData} />
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
                onClick={() => {
                  if (isAdminMode || isFinalized) {
                    navigate(isAdminMode ? '/admin' : '/');
                  } else {
                    setShowExitConfirm(true);
                  }
                }}
                className={`h-14 ${isFinalized || isAdminMode ? 'w-full' : 'flex-1'} text-base font-semibold gap-2`}
              >
                <ArrowLeft className="h-5 w-5" />
                {isAdminMode ? 'Volver a admin' : isFinalized ? 'Salir' : 'Salir sin finalizar'}
              </Button>
              {!isFinalized && !isAdminMode && (
                <Button
                  onClick={finishVisita}
                  disabled={finishing}
                  variant="default"
                  className="h-14 flex-[2] text-base font-bold gap-2 bg-success hover:bg-success/90 text-success-foreground shadow-lg ring-2 ring-success/30"
                >
                  {finishing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                  {finishing ? 'Finalizando...' : 'FINALIZAR Y FIRMAR'}
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

      {/* GPS requesting dialog */}
      <Dialog open={finishGeo.status === 'requesting'} onOpenChange={(open) => { if (!open) setFinishGeo({ status: 'idle' }); }}>
        <DialogContent className="max-w-xl text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Obteniendo ubicación de cierre
            </DialogTitle>
            <DialogDescription className="text-center">
              Permite el acceso a tu ubicación para registrar el punto de fin de la visita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setFinishGeo({ status: 'idle' })}>Cancelar</Button>
            <Button variant="secondary" onClick={() => persistFinish(null, null)}>
              Continuar sin ubicación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GPS error dialog */}
      <Dialog open={finishGeo.status === 'error'} onOpenChange={(open) => { if (!open) setFinishGeo({ status: 'idle' }); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              No se pudo obtener tu ubicación
            </DialogTitle>
            <DialogDescription>
              {finishGeo.status === 'error' && finishGeo.kind === 'denied' && 'Has denegado el permiso de ubicación. Habilítalo en los ajustes del navegador para registrar el punto de fin de la visita.'}
              {finishGeo.status === 'error' && finishGeo.kind === 'timeout' && 'La búsqueda de tu ubicación ha tardado demasiado. Sal a un sitio con mejor señal GPS o continúa sin ubicación.'}
              {finishGeo.status === 'error' && finishGeo.kind === 'unavailable' && 'Tu dispositivo no puede determinar la ubicación ahora mismo. Puedes reintentar o continuar sin ubicación.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setFinishGeo({ status: 'idle' })}>Cerrar</Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => persistFinish(null, null)}>
                Continuar sin ubicación
              </Button>
              {finishGeo.status === 'error' && finishGeo.kind !== 'denied' && (
                <Button onClick={finishVisita}>Reintentar</Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm finish with map */}
      <Dialog open={finishGeo.status === 'confirm'} onOpenChange={(open) => { if (!open) setFinishGeo({ status: 'idle' }); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Confirmar fin de visita
            </DialogTitle>
          </DialogHeader>
          {finishGeo.status === 'confirm' && (
            <div className="space-y-4">
              <MapPicker
                readOnly
                markers={[
                  { lat: finishGeo.obraLat, lng: finishGeo.obraLng, color: '#F37520', label: 'Obra' },
                  { lat: finishGeo.lat, lng: finishGeo.lng, color: '#3B82F6', label: 'Tu ubicación' },
                ]}
                lat={finishGeo.lat}
                lng={finishGeo.lng}
              />
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="inline-block h-3 w-3 rounded-full bg-primary" />
                <span>Obra</span>
                <span className="mx-2 text-muted-foreground">·</span>
                <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
                <span>Tú</span>
                <span className="mx-2 text-muted-foreground">·</span>
                <span className="font-semibold">{formatDistance(finishGeo.distance)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinishGeo({ status: 'idle' })}>Cancelar</Button>
            <Button
              onClick={() => {
                if (finishGeo.status === 'confirm') persistFinish(finishGeo.lat, finishGeo.lng);
              }}
              className="h-12 rounded-xl bg-success hover:bg-success/90 text-success-foreground"
            >
              Confirmar fin de visita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saving overlay */}
      <Dialog open={finishGeo.status === 'saving'}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader>
            <DialogTitle>Finalizando visita</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Firmas de presencia (paso obligatorio antes del cierre) */}
      <FirmaPresenciaDialog
        open={showFirmas}
        onOpenChange={setShowFirmas}
        tecnicoNombre={tecnicoNombre}
        firmaPerfilUrl={firmaPerfilUrl}
        onConfirm={handleFirmasConfirmed}
      />

      {/* Confirmación al salir sin finalizar */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              La visita no se ha cerrado
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                La visita quedará guardada como borrador y aparecerá en «Visitas recientes». No se ha finalizado ni firmado.
              </span>
              <span className="block font-semibold text-foreground">
                Para cerrarla definitivamente pulsa <span className="text-success">FINALIZAR Y FIRMAR</span> y completa las firmas de presencia.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar visita</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowExitConfirm(false);
                navigate('/');
              }}
            >
              Salir como borrador
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
