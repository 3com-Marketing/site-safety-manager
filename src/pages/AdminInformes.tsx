import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { FileText, ChevronRight, Radio, HardHat, AlertTriangle, CheckCircle2, Clock, Activity, Eye, FolderCheck } from 'lucide-react';
import { calcExpedienteStatus, ExpedienteDot, type ExpedienteStatus } from '@/lib/expedienteStatus';
import { format, startOfToday, startOfMonth, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface VisitaRow {
  id: string;
  estado: string;
  fecha: string;
  obra_nombre: string;
  tecnico_nombre: string;
}

interface InformeRow {
  id: string;
  estado: string;
  fecha: string;
  obra_nombre: string;
  tecnico_nombre: string;
  visita_id: string;
  obra_id?: string;
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

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function DurationBadge({ fecha }: { fecha: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);
  const mins = differenceInMinutes(new Date(), new Date(fecha));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return (
    <span className="text-xs text-muted-foreground font-mono">
      {h > 0 ? `${h}h ${m}m` : `${m}m`}
    </span>
  );
}

export default function AdminInformes() {
  const navigate = useNavigate();
  const [informes, setInformes] = useState<InformeRow[]>([]);
  const [visitas, setVisitas] = useState<VisitaRow[]>([]);
  const [filter, setFilter] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [expedienteMap, setExpedienteMap] = useState<Record<string, ExpedienteStatus>>({});
  const visitaIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchAll = async () => {
      const [informesRes, visitasRes, docsRes] = await Promise.all([
        supabase
          .from('informes')
          .select('id, estado, fecha, visita_id, visitas(obra_id, obras(nombre), profiles!visitas_usuario_id_profiles_fkey(nombre))')
          .order('fecha', { ascending: false }),
        supabase
          .from('visitas')
          .select('id, estado, fecha, obras(nombre), profiles!visitas_usuario_id_profiles_fkey(nombre)')
          .order('fecha', { ascending: false })
          .limit(100),
        supabase.from('documentos_obra').select('obra_id, tipo, estado'),
      ]);

      // Build expediente map
      const docsByObra: Record<string, { tipo: string; estado: string }[]> = {};
      (docsRes.data || []).forEach((d: any) => {
        if (!docsByObra[d.obra_id]) docsByObra[d.obra_id] = [];
        docsByObra[d.obra_id].push({ tipo: d.tipo, estado: d.estado });
      });
      const expMap: Record<string, ExpedienteStatus> = {};
      Object.entries(docsByObra).forEach(([obraId, docs]) => {
        expMap[obraId] = calcExpedienteStatus(docs);
      });
      setExpedienteMap(expMap);

      setInformes(
        (informesRes.data || []).map((i: any) => ({
          id: i.id,
          estado: i.estado,
          fecha: i.fecha,
          visita_id: i.visita_id,
          obra_id: i.visitas?.obra_id,
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

    const channel = supabase
      .channel('admin-visitas')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'visitas' },
        async (payload) => {
          const newVisita = payload.new as any;
          if (visitaIdsRef.current.has(newVisita.id)) return;

          const { data: full } = await supabase
            .from('visitas')
            .select('id, estado, fecha, obras(nombre), profiles!visitas_usuario_id_profiles_fkey(nombre)')
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

  const today = startOfToday();
  const monthStart = startOfMonth(new Date());

  const visitasHoy = useMemo(() =>
    visitas.filter(v => new Date(v.fecha) >= today), [visitas, today]);
  
  const visitasEnProgreso = useMemo(() =>
    visitas.filter(v => v.estado === 'en_progreso'), [visitas]);

  const informesPendientes = useMemo(() =>
    informes.filter(i => i.estado === 'pendiente_revision'), [informes]);

  const informesCerradosMes = useMemo(() =>
    informes.filter(i => i.estado === 'cerrado' && new Date(i.fecha) >= monthStart), [informes, monthStart]);

  const visitasFinalizadasHoy = useMemo(() =>
    visitasHoy.filter(v => v.estado === 'finalizada'), [visitasHoy]);

  const [activeKpi, setActiveKpi] = useState<'visitas_hoy' | 'en_progreso' | 'pendientes' | 'cerrados_mes' | null>(null);
  const visitasProgresoRef = useRef<HTMLDivElement>(null);
  const actividadHoyRef = useRef<HTMLDivElement>(null);
  const informesRef = useRef<HTMLDivElement>(null);

  const filtered = (() => {
    let base = filter === 'todos' ? informes : informes.filter(i => i.estado === filter);
    if (activeKpi === 'cerrados_mes') {
      base = base.filter(i => i.estado === 'cerrado' && new Date(i.fecha) >= monthStart);
    }
    return base;
  })();

  const handleKpiClick = (kpi: 'visitas_hoy' | 'en_progreso' | 'pendientes' | 'cerrados_mes') => {
    if (activeKpi === kpi) {
      setActiveKpi(null);
      if (kpi === 'pendientes' || kpi === 'cerrados_mes') setFilter('todos');
      return;
    }
    setActiveKpi(kpi);
    if (kpi === 'pendientes') setFilter('pendiente_revision');
    else if (kpi === 'cerrados_mes') setFilter('cerrado');
    else setFilter('todos');

    setTimeout(() => {
      const target =
        kpi === 'visitas_hoy' ? actividadHoyRef.current :
        kpi === 'en_progreso' ? visitasProgresoRef.current :
        informesRef.current;
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const kpiCardClass = (active: boolean) =>
    `text-left w-full rounded-lg border bg-card transition-all cursor-pointer hover:border-primary/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'
    }`;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <HardHat className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">{visitasHoy.length}</p>
                <p className="text-xs text-muted-foreground">Visitas hoy</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                <Activity className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">{visitasEnProgreso.length}</p>
                <p className="text-xs text-muted-foreground">En progreso</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">{informesPendientes.length}</p>
                <p className="text-xs text-muted-foreground">Informes pendientes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">{informesCerradosMes.length}</p>
                <p className="text-xs text-muted-foreground">Cerrados este mes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visitas en progreso */}
        {visitasEnProgreso.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-warning animate-pulse" />
              <h2 className="font-heading text-lg font-bold">Visitas en progreso</h2>
              <Badge variant="secondary" className="ml-auto">{visitasEnProgreso.length} activas</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visitasEnProgreso.map(v => (
                <Card
                  key={v.id}
                  className="border-warning/40 cursor-pointer transition-all hover:border-primary hover:shadow-md animate-pulse-border"
                  onClick={() => navigate(`/admin/visita/${v.id}`)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 bg-primary/10">
                        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                          {getInitials(v.tecnico_nombre)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-heading font-semibold text-sm truncate">{v.tecnico_nombre}</p>
                        <p className="text-xs text-muted-foreground truncate">{v.obra_nombre}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(v.fecha), "HH:mm", { locale: es })}
                      </div>
                      <DurationBadge fecha={v.fecha} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-warning/10 text-warning">En progreso</span>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Actividad de hoy */}
        <div className="space-y-3">
          <h2 className="font-heading text-lg font-bold">Actividad de hoy</h2>
          {visitasHoy.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                No hay actividad registrada hoy
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {visitasHoy.map(v => (
                <button
                  key={v.id}
                  onClick={() => navigate(`/admin/visita/${v.id}`)}
                  className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
                >
                  <div className="text-center shrink-0 w-12">
                    <p className="text-sm font-heading font-bold">{format(new Date(v.fecha), "HH:mm")}</p>
                  </div>
                  <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${v.estado === 'en_progreso' ? 'bg-warning animate-pulse' : 'bg-success'}`} />
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-[10px] font-bold bg-secondary text-secondary-foreground">
                      {getInitials(v.tecnico_nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading font-semibold text-sm truncate">{v.obra_nombre}</p>
                    <p className="text-xs text-muted-foreground truncate">{v.tecnico_nombre}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 ${
                    v.estado === 'en_progreso' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                  }`}>
                    {v.estado === 'en_progreso' ? 'En progreso' : 'Finalizada'}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Visitas finalizadas hoy */}
        {visitasFinalizadasHoy.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-heading text-lg font-bold">Finalizadas hoy</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visitasFinalizadasHoy.map(v => (
                <Card
                  key={v.id}
                  className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                  onClick={() => navigate(`/admin/visita/${v.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs font-bold bg-success/10 text-success">
                          {getInitials(v.tecnico_nombre)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-heading font-semibold text-sm truncate">{v.tecnico_nombre}</p>
                        <p className="text-xs text-muted-foreground truncate">{v.obra_nombre}</p>
                      </div>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-success/10 text-success">Finalizada</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(v.fecha), "HH:mm", { locale: es })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Informes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold">Informes</h2>
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

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                No hay informes
              </CardContent>
            </Card>
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
                    {inf.obra_id && <ExpedienteDot status={expedienteMap[inf.obra_id] || 'sin_datos'} />}
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
