import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, Building2, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Obra {
  id: string;
  nombre: string;
  direccion: string;
  cliente_nombre: string;
}

type GeoState =
  | { status: 'idle' }
  | { status: 'requesting'; obraId: string }
  | { status: 'creating'; obraId: string; lat: number | null; lng: number | null };

export default function SelectObra() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [geo, setGeo] = useState<GeoState>({ status: 'idle' });

  useEffect(() => {
    supabase
      .from('obras')
      .select('id, nombre, direccion, clientes(nombre)')
      .order('nombre')
      .then(({ data }) => {
        setObras(
          (data || []).map((o: any) => ({
            id: o.id,
            nombre: o.nombre,
            direccion: o.direccion,
            cliente_nombre: o.clientes?.nombre || '',
          }))
        );
        setLoading(false);
      });
  }, []);

  const handleSelectObra = (obraId: string) => {
    if (!user) return;
    setGeo({ status: 'requesting', obraId });

    if (!navigator.geolocation) {
      createVisita(obraId, null, null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        createVisita(obraId, pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        // GPS denied or error — continue without location
        createVisita(obraId, null, null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
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
      setGeo({ status: 'idle' });
    }
  };

  const isBusy = geo.status !== 'idle';

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-heading text-lg font-bold">Seleccionar obra</h1>
      </header>

      <div className="mx-auto max-w-2xl p-4 space-y-2">
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
              className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 disabled:opacity-50"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Building2 className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-semibold truncate">{obra.nombre}</p>
                <p className="text-xs text-muted-foreground truncate">{obra.cliente_nombre} · {obra.direccion}</p>
              </div>
              {geo.status !== 'idle' && geo.obraId === obra.id && (
                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {geo.status === 'requesting' ? 'Ubicación...' : 'Creando...'}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {/* GPS dialog */}
      <Dialog open={geo.status === 'requesting'}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Obteniendo ubicación
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Permite el acceso a tu ubicación para registrar el punto de inicio de la visita.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
