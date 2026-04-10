import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { FileText, ChevronRight, Radio } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface InformeRow {
  id: string;
  estado: string;
  fecha: string;
  obra_nombre: string;
  tecnico_nombre: string;
}

interface VisitaRow {
  id: string;
  estado: string;
  fecha: string;
  obra_nombre: string;
  tecnico_nombre: string;
}

const ESTADOS_FILTER = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente_revision', label: 'Pendiente' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'cerrado', label: 'Cerrado' },
];

const estadoLabel = (e: string) => {
  switch (e) {
    case 'borrador': return 'Borrador';
    case 'pendiente_revision': return 'Pendiente revisión';
    case 'cerrado': return 'Cerrado';
    default: return e;
  }
};

const estadoColor = (e: string) => {
  switch (e) {
    case 'borrador': return 'bg-muted text-muted-foreground';
    case 'pendiente_revision': return 'bg-warning/10 text-warning';
    case 'cerrado': return 'bg-success/10 text-success';
    default: return 'bg-muted text-muted-foreground';
  }
};

const visitaEstadoLabel = (e: string) => {
  switch (e) {
    case 'en_progreso': return 'En progreso';
    case 'finalizada': return 'Finalizada';
    default: return e;
  }
};

const visitaEstadoColor = (e: string) => {
  switch (e) {
    case 'en_progreso': return 'bg-warning/10 text-warning';
    case 'finalizada': return 'bg-success/10 text-success';
    default: return 'bg-muted text-muted-foreground';
  }
};

export default function AdminInformes() {
  const navigate = useNavigate();
  const [informes, setInformes] = useState<InformeRow[]>([]);
  const [visitas, setVisitas] = useState<VisitaRow[]>([]);
  const [filter, setFilter] = useState('todos');
  const [loading, setLoading] = useState(true);
  const visitaIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchAll = async () => {
      const [informesRes, visitasRes] = await Promise.all([
        supabase
          .from('informes')
          .select('id, estado, fecha, visitas(obras(nombre), profiles:usuario_id(nombre))')
          .order('fecha', { ascending: false }),
        supabase
          .from('visitas')
          .select('id, estado, fecha, obras(nombre), profiles:usuario_id(nombre)')
          .order('fecha', { ascending: false })
          .limit(50),
      ]);

      setInformes(
        (informesRes.data || []).map((i: any) => ({
          id: i.id,
          estado: i.estado,
          fecha: i.fecha,
          obra_nombre: i.visitas?.obras?.nombre || 'Obra',
          tecnico_nombre: i.visitas?.profiles?.nombre || 'Técnico',
        }))
      );

      const visitasData = (visitasRes.data || []).map((v: any) => ({
        id: v.id,
        estado: v.estado,
        fecha: v.fecha,
        obra_nombre: v.obras?.nombre || 'Obra',
        tecnico_nombre: v.profiles?.nombre || 'Técnico',
      }));
      setVisitas(visitasData);
      visitaIdsRef.current = new Set(visitasData.map((v: VisitaRow) => v.id));
      setLoading(false);
    };

    fetchAll();

    // Realtime subscription
    const channel = supabase
      .channel('admin-visitas')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'visitas' },
        async (payload) => {
          const newVisita = payload.new as any;
          if (visitaIdsRef.current.has(newVisita.id)) return;

          // Fetch related data
          const { data: full } = await supabase
            .from('visitas')
            .select('id, estado, fecha, obras(nombre), profiles:usuario_id(nombre)')
            .eq('id', newVisita.id)
            .single();

          if (full) {
            const row: VisitaRow = {
              id: full.id,
              estado: full.estado,
              fecha: full.fecha,
              obra_nombre: (full as any).obras?.nombre || 'Obra',
              tecnico_nombre: (full as any).profiles?.nombre || 'Técnico',
            };
            setVisitas(prev => [row, ...prev]);
            visitaIdsRef.current.add(row.id);
            toast('🔔 Nueva visita iniciada', {
              description: `${row.tecnico_nombre} en ${row.obra_nombre}`,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'visitas' },
        (payload) => {
          const updated = payload.new as any;
          setVisitas(prev =>
            prev.map(v => v.id === updated.id ? { ...v, estado: updated.estado } : v)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = filter === 'todos' ? informes : informes.filter(i => i.estado === filter);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Visitas activas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-warning animate-pulse" />
            <h2 className="font-heading text-xl font-bold">Visitas de técnicos</h2>
          </div>

          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : visitas.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay visitas recientes</p>
          ) : (
            <div className="space-y-2">
              {visitas.map(v => (
                <button
                  key={v.id}
                  onClick={() => navigate(`/admin/visita/${v.id}`)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-3 w-3 rounded-full ${v.estado === 'en_progreso' ? 'bg-warning animate-pulse' : 'bg-success'}`} />
                    <div>
                      <p className="font-heading font-semibold text-sm">{v.obra_nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.tecnico_nombre} · {format(new Date(v.fecha), "dd MMM yyyy, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${visitaEstadoColor(v.estado)}`}>
                      {visitaEstadoLabel(v.estado)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold">Informes</h2>
          </div>

          <div className="flex gap-2 flex-wrap">
            {ESTADOS_FILTER.map(ef => (
              <button
                key={ef.value}
                onClick={() => setFilter(ef.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === ef.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {ef.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-muted-foreground">Cargando informes...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground">No hay informes</p>
          ) : (
            <div className="space-y-2">
              {filtered.map(inf => (
                <button
                  key={inf.id}
                  onClick={() => navigate(`/admin/informe/${inf.id}`)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <FileText className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-sm">{inf.obra_nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {inf.tecnico_nombre} · {format(new Date(inf.fecha), "dd MMM yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${estadoColor(inf.estado)}`}>
                      {estadoLabel(inf.estado)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
