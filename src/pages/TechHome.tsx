import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { HardHat, LogOut, Plus, ChevronRight, FileText } from 'lucide-react';
import { format, addDays, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { TIPO_DOCUMENTO_LABELS, type TipoDocumento } from '@/types/documentos';

const isWithinEditWindow = (fecha: string) => isAfter(addDays(new Date(fecha), 7), new Date());

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
  const [docsPendientes, setDocsPendientes] = useState<{ id: string; tipo: string; obra_nombre: string; obra_id: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      try {
        const { data: visitasData } = await supabase
          .from('visitas')
          .select('id, fecha, estado, obras(nombre)')
          .eq('usuario_id', user.id)
          .order('fecha', { ascending: false })
          .limit(10);

        setVisitas(
          (visitasData || []).map((v: any) => ({
            id: v.id,
            fecha: v.fecha,
            estado: v.estado,
            obra_nombre: v.obras?.nombre || 'Obra',
          }))
        );

        const tiposTecnico = ['acta_reunion_cae', 'acta_reunion_inicial', 'acta_reunion_sys', 'informe_css', 'informe_at'];
        const tiposTecnicoTyped = tiposTecnico as Array<'acta_reunion_cae' | 'acta_reunion_inicial' | 'acta_reunion_sys' | 'informe_css' | 'informe_at'>;
        const { data: docsData } = await supabase
          .from('documentos_obra')
          .select('id, tipo, estado, obra_id, obras(nombre)')
          .in('tipo', tiposTecnicoTyped)
          .eq('estado', 'pendiente');

        setDocsPendientes(
          (docsData || []).map((d: any) => ({
            id: d.id,
            tipo: d.tipo,
            obra_nombre: d.obras?.nombre || 'Obra',
            obra_id: d.obra_id,
          }))
        );
      } catch (err) {
        console.error('Error fetching tech data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
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

        {/* Pending docs */}
        {docsPendientes.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">Documentos pendientes</h2>
            <div className="space-y-2">
              {docsPendientes.map(d => (
                <button
                  key={d.id}
                  onClick={() => navigate(`/documentos/${d.obra_id}`)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
                >
                  <FileText className="h-5 w-5 text-destructive shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-heading font-semibold text-sm truncate">{d.obra_nombre}</p>
                    <p className="text-xs text-muted-foreground">{TIPO_DOCUMENTO_LABELS[d.tipo as TipoDocumento] || d.tipo}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-destructive/10 text-destructive">Pendiente</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent visits */}
        <div className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Visitas recientes</h2>
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : visitas.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay visitas aún</p>
          ) : (
            <div className="space-y-2">
              {visitas.map(v => {
                const editable = v.estado === 'en_progreso' || (v.estado === 'finalizada' && isWithinEditWindow(v.fecha));
                const editableUntil = v.estado === 'finalizada' && editable
                  ? format(addDays(new Date(v.fecha), 7), "dd MMM", { locale: es })
                  : null;

                return (
                <button
                  key={v.id}
                  onClick={() => editable ? navigate(`/visita/${v.id}`) : undefined}
                  disabled={!editable}
                  className={`flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-colors ${editable ? 'hover:border-primary/50' : 'opacity-60 cursor-default'}`}
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
                        : editable
                          ? 'bg-warning/10 text-warning'
                          : 'bg-success/10 text-success'
                    }`}>
                      {v.estado === 'en_progreso' ? 'En progreso' : editable ? `Editable hasta ${editableUntil}` : 'Finalizada'}
                    </span>
                    {editable && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>);
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
