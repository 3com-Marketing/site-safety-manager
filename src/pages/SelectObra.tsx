import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, Building2, MapPin, Loader2, Navigation, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import MapPicker from '@/components/MapPicker';
import { haversineDistance, formatDistance } from '@/lib/geo';
import { toast } from 'sonner';

interface Obra {
  id: string;
  nombre: string;
  direccion: string;
  cliente_nombre: string;
  latitud: number | null;
  longitud: number | null;
}

type GeoErrorKind = 'denied' | 'unavailable' | 'timeout';

type GeoState =
  | { status: 'idle' }
  | { status: 'requesting'; obraId: string }
  | { status: 'error'; obraId: string; kind: GeoErrorKind }
  | { status: 'confirm'; obraId: string; lat: number; lng: number; obraLat: number; obraLng: number; distance: number }
  | { status: 'creating'; obraId: string; lat: number | null; lng: number | null };


export default function SelectObra() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [geo, setGeo] = useState<GeoState>({ status: 'idle' });
  const cancelRef = useRef(false);

  useEffect(() => {
    supabase
      .from('obras')
      .select('id, nombre, direccion, latitud, longitud, clientes(nombre)')
      .order('nombre')
      .then(({ data }) => {
        setObras(
          (data || []).map((o: any) => ({
            id: o.id,
            nombre: o.nombre,
            direccion: o.direccion,
            cliente_nombre: o.clientes?.nombre || '',
            latitud: o.latitud,
            longitud: o.longitud,
          }))
        );
        setLoading(false);
      });
  }, []);

  const cancelGeo = () => {
    cancelRef.current = true;
    setGeo({ status: 'idle' });
  };

  const handleSelectObra = async (obraId: string) => {
    if (!user) return;
    cancelRef.current = false;

    if (!navigator.geolocation) {
      setGeo({ status: 'error', obraId, kind: 'unavailable' });
      return;
    }

    // Pre-check permission state to fail fast on denied
    try {
      // @ts-ignore - permissions API not typed everywhere
      if (navigator.permissions?.query) {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (status.state === 'denied') {
          setGeo({ status: 'error', obraId, kind: 'denied' });
          return;
        }
      }
    } catch {
      // ignore permission API errors and try anyway
    }

    setGeo({ status: 'requesting', obraId });
    const obra = obras.find(o => o.id === obraId);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelRef.current) return;
        const tecLat = pos.coords.latitude;
        const tecLng = pos.coords.longitude;

        if (obra?.latitud && obra?.longitud) {
          const dist = haversineDistance(tecLat, tecLng, obra.latitud, obra.longitud);
          setGeo({
            status: 'confirm',
            obraId,
            lat: tecLat,
            lng: tecLng,
            obraLat: obra.latitud,
            obraLng: obra.longitud,
            distance: dist,
          });
        } else {
          createVisita(obraId, tecLat, tecLng);
        }
      },
      (err) => {
        if (cancelRef.current) return;
        const kind: GeoErrorKind =
          err.code === err.PERMISSION_DENIED ? 'denied' :
          err.code === err.TIMEOUT ? 'timeout' : 'unavailable';
        setGeo({ status: 'error', obraId, kind });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  };

  const createVisita = async (obraId: string, lat: number | null, lng: number | null) => {
    if (!user) return;
    setGeo({ status: 'creating', obraId, lat, lng });
    try {
      const { data: visita, error: visitaError } = await supabase
        .from('visitas')
        .insert({
          obra_id: obraId,
          usuario_id: user.id,
          lat_inicio: lat,
          lng_inicio: lng,
        })
        .select('id')
        .single();

      if (visitaError) throw visitaError;

      const { error: informeError } = await supabase
        .from('informes')
        .insert({ visita_id: visita.id });

      if (informeError) throw informeError;

      navigate(`/visita/${visita.id}`);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo crear la visita');
      setGeo({ status: 'idle' });
    }
  };

  const isBusy = geo.status !== 'idle';
  const confirmState = geo.status === 'confirm' ? geo : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-heading text-lg font-bold">Seleccionar obra</h1>
      </header>

      <div className="mx-auto max-w-2xl p-3 sm:p-4 space-y-2">
        {loading ? (
          <p className="text-muted-foreground text-sm">Cargando obras...</p>
        ) : obras.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay obras disponibles. Contacta al administrador.</p>
        ) : (
          obras.map(obra => (
            <button
              key={obra.id}
              disabled={isBusy}
              onClick={() => handleSelectObra(obra.id)}
              className="flex w-full items-center gap-3 sm:gap-4 rounded-xl border border-border bg-card p-3 sm:p-4 text-left transition-colors hover:border-primary/50 disabled:opacity-50"
            >
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-semibold truncate">{obra.nombre}</p>
                <p className="text-xs text-muted-foreground truncate">{obra.cliente_nombre} · {obra.direccion}</p>
              </div>
              {(geo.status === 'requesting' || geo.status === 'creating') && geo.obraId === obra.id && (
                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {geo.status === 'requesting' ? 'Ubicación...' : 'Creando...'}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {/* GPS requesting dialog */}
      <Dialog open={geo.status === 'requesting'} onOpenChange={(open) => { if (!open) cancelGeo(); }}>
        <DialogContent className="max-w-xl text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Obteniendo ubicación
            </DialogTitle>
            <DialogDescription className="text-center">
              Permite el acceso a tu ubicación para registrar el punto de inicio de la visita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={cancelGeo}>Cancelar</Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (geo.status === 'requesting') {
                  const obraId = geo.obraId;
                  cancelRef.current = true;
                  createVisita(obraId, null, null);
                }
              }}
            >
              Continuar sin ubicación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GPS error dialog */}
      <Dialog open={geo.status === 'error'} onOpenChange={(open) => { if (!open) setGeo({ status: 'idle' }); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              No se pudo obtener tu ubicación
            </DialogTitle>
            <DialogDescription>
              {geo.status === 'error' && geo.kind === 'denied' && 'Has denegado el permiso de ubicación. Habilítalo en los ajustes del navegador para registrar el punto de inicio de la visita.'}
              {geo.status === 'error' && geo.kind === 'timeout' && 'La búsqueda de tu ubicación ha tardado demasiado. Sal a un sitio con mejor señal GPS o continúa sin ubicación.'}
              {geo.status === 'error' && geo.kind === 'unavailable' && 'Tu dispositivo no puede determinar la ubicación ahora mismo. Puedes reintentar o continuar sin ubicación.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setGeo({ status: 'idle' })}>Cerrar</Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  if (geo.status === 'error') createVisita(geo.obraId, null, null);
                }}
              >
                Continuar sin ubicación
              </Button>
              {geo.status === 'error' && geo.kind !== 'denied' && (
                <Button
                  onClick={() => {
                    if (geo.status === 'error') handleSelectObra(geo.obraId);
                  }}
                >
                  Reintentar
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Distance confirmation dialog */}
      <Dialog open={!!confirmState} onOpenChange={(open) => { if (!open) setGeo({ status: 'idle' }); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Confirmar inicio de visita
            </DialogTitle>
          </DialogHeader>
          {confirmState && (
            <div className="space-y-4">
              <MapPicker
                readOnly
                markers={[
                  { lat: confirmState.obraLat, lng: confirmState.obraLng, color: '#F37520', label: 'Obra' },
                  { lat: confirmState.lat, lng: confirmState.lng, color: '#3B82F6', label: 'Tu ubicación' },
                ]}
                lat={confirmState.lat}
                lng={confirmState.lng}
              />
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="inline-block h-3 w-3 rounded-full bg-primary" />
                <span>Obra</span>
                <span className="mx-2 text-muted-foreground">·</span>
                <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
                <span>Tú</span>
                <span className="mx-2 text-muted-foreground">·</span>
                <span className="font-semibold">{formatDistance(confirmState.distance)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setGeo({ status: 'idle' })}>Cancelar</Button>
            <Button
              onClick={() => {
                if (confirmState) createVisita(confirmState.obraId, confirmState.lat, confirmState.lng);
              }}
              className="h-12 rounded-xl"
            >
              Confirmar inicio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
