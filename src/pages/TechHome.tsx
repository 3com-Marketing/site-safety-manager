import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { HardHat, LogOut, Plus, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface VisitaReciente {
  id: string;
  fecha: string;
  estado: string;
  obra_nombre: string;
}

export default function TechHome() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [visitas, setVisitas] = useState<VisitaReciente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('visitas')
      .select('id, fecha, estado, obras(nombre)')
      .eq('usuario_id', user.id)
      .order('fecha', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setVisitas(
          (data || []).map((v: any) => ({
            id: v.id,
            fecha: v.fecha,
            estado: v.estado,
            obra_nombre: v.obras?.nombre || 'Obra',
          }))
        );
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <HardHat className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold">SafeWork</h1>
            <p className="text-xs text-muted-foreground">Técnico</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut}>
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <div className="mx-auto max-w-2xl p-4 space-y-6">
        {/* Main action */}
        <Button
          onClick={() => navigate('/seleccionar-obra')}
          className="h-20 w-full text-xl font-bold gap-3"
          size="lg"
        >
          <Plus className="h-7 w-7" />
          INICIAR VISITA
        </Button>

        {/* Recent visits */}
        <div className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Visitas recientes</h2>
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : visitas.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay visitas aún</p>
          ) : (
            <div className="space-y-2">
              {visitas.map(v => (
                <button
                  key={v.id}
                  onClick={() => v.estado === 'en_progreso' ? navigate(`/visita/${v.id}`) : null}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
                >
                  <div>
                    <p className="font-heading font-semibold text-sm">{v.obra_nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(v.fecha), "dd MMM yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      v.estado === 'en_progreso'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-success/10 text-success'
                    }`}>
                      {v.estado === 'en_progreso' ? 'En progreso' : 'Finalizada'}
                    </span>
                    {v.estado === 'en_progreso' && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
