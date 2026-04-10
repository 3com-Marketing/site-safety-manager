import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { FileText, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InformeRow {
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

export default function AdminInformes() {
  const navigate = useNavigate();
  const [informes, setInformes] = useState<InformeRow[]>([]);
  const [filter, setFilter] = useState('todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('informes')
      .select('id, estado, fecha, visitas(obras(nombre), profiles:usuario_id(nombre))')
      .order('fecha', { ascending: false })
      .then(({ data }) => {
        setInformes(
          (data || []).map((i: any) => ({
            id: i.id,
            estado: i.estado,
            fecha: i.fecha,
            obra_nombre: i.visitas?.obras?.nombre || 'Obra',
            tecnico_nombre: i.visitas?.profiles?.nombre || 'Técnico',
          }))
        );
        setLoading(false);
      });
  }, []);

  const filtered = filter === 'todos' ? informes : informes.filter(i => i.estado === filter);

  return (
    <AdminLayout>
      <div className="space-y-6">
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
    </AdminLayout>
  );
}
