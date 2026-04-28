import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  FileText, ChevronRight, HardHat, AlertTriangle, CheckCircle2, Clock,
  TimerReset, FileWarning, FileClock,
} from 'lucide-react';
import { calcExpedienteStatus, ExpedienteDot, type ExpedienteStatus } from '@/lib/expedienteStatus';
import { format, startOfToday, startOfMonth, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface VisitaRow {
  id: string;
  estado: string;
  fecha: string;
  obra_id?: string;
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

type EstadoChip = 'todos' | 'en_progreso' | 'pendiente_revision' | 'borrador';
type SortMode = 'tiempo_desc' | 'tiempo_asc' | 'hora_entrada';
type KpiKey = 'visitas_hoy' | 'tiempo_excedido' | 'pendientes' | 'cerrados_mes';

const ESTADO_CHIPS: { value: EstadoChip; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'pendiente_revision', label: 'Pendiente revisión' },
  { value: 'borrador', label: 'Borrador' },
];

const HORAS_EXCEDIDO = 168;
const HORAS_WARNING = 72;

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function minutesSince(fecha: string) {
  return differenceInMinutes(new Date(), new Date(fecha));
}

function formatDur(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function tiempoColor(mins: number) {
  const h = mins / 60;
  if (h > HORAS_EXCEDIDO) return 'text-destructive';
  if (h > HORAS_WARNING) return 'text-warning';
  return 'text-muted-foreground';
}

function DurationBadge({ fecha, className }: { fecha: string; className?: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);
  const mins = minutesSince(fecha);
  return (
    <span className={`text-sm font-mono font-semibold ${className ?? tiempoColor(mins)}`}>
      {formatDur(mins)}
    </span>
  );
}

const informePillClass = (e: string) => {
  switch (e) {
    case 'pendiente_revision': return 'bg-warning/10 text-warning';
    case 'cerrado': return 'bg-success/10 text-success';
    case 'borrador':
    default: return 'bg-muted text-muted-foreground';
  }
};

const informeLabel = (e: string) => {
  switch (e) {
    case 'borrador': return 'Borrador';
    case 'pendiente_revision': return 'Pendiente';
    case 'cerrado': return 'Cerrado';
    default: return e;
  }
};

export default function AdminInformes() {
  const navigate = useNavigate();
  const [informes, setInformes] = useState<InformeRow[]>([]);
  const [visitas, setVisitas] = useState<VisitaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expedienteMap, setExpedienteMap] = useState<Record<string, ExpedienteStatus>>({});
  const visitaIdsRef = useRef<Set<string>>(new Set());

  // filtros
  const [estadoChip, setEstadoChip] = useState<EstadoChip>('todos');
  const [obraFilter, setObraFilter] = useState<string>('todas');
  const [sortMode, setSortMode] = useState<SortMode>('tiempo_desc');
  const [activeKpi, setActiveKpi] = useState<KpiKey | null>(null);
  const [showAllVisitas, setShowAllVisitas] = useState(false);
  const [showAllInformes, setShowAllInformes] = useState(false);

  const listsRef = useRef<HTMLDivElement>(null);

  // Reset expand state when filters change
  useEffect(() => {
    setShowAllVisitas(false);
    setShowAllInformes(false);
  }, [estadoChip, obraFilter, activeKpi]);

  useEffect(() => {
    const fetchAll = async () => {
      const [informesRes, visitasRes, docsRes] = await Promise.all([
        supabase
          .from('informes')
          .select('id, estado, fecha, visita_id, visitas(obra_id, obras(nombre), profiles!visitas_usuario_id_profiles_fkey(nombre))')
          .order('fecha', { ascending: false }),
        supabase
          .from('visitas')
          .select('id, estado, fecha, obra_id, obras(nombre), profiles!visitas_usuario_id_profiles_fkey(nombre)')
          .order('fecha', { ascending: false })
          .limit(100),
        supabase.from('documentos_obra').select('obra_id, tipo, estado'),
      ]);

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
        obra_id: v.obra_id,
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
            .select('id, estado, fecha, obra_id, obras(nombre), profiles!visitas_usuario_id_profiles_fkey(nombre)')
            .eq('id', newVisita.id)
            .single();

          if (full) {
            const row: VisitaRow = {
              id: full.id,
              estado: full.estado,
              fecha: full.fecha,
              obra_id: (full as any).obra_id,
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

  const visitasHoy = useMemo(
    () => visitas.filter(v => new Date(v.fecha) >= today),
    [visitas, today]
  );

  const visitasEnProgreso = useMemo(
    () => visitas.filter(v => v.estado === 'en_progreso'),
    [visitas]
  );

  const visitasTiempoExcedido = useMemo(
    () => visitasEnProgreso.filter(v => minutesSince(v.fecha) / 60 > HORAS_EXCEDIDO),
    [visitasEnProgreso]
  );

  const informesPendientes = useMemo(
    () => informes.filter(i => i.estado === 'pendiente_revision'),
    [informes]
  );

  const informesCerradosMes = useMemo(
    () => informes.filter(i => i.estado === 'cerrado' && new Date(i.fecha) >= monthStart),
    [informes, monthStart]
  );

  const informesNoCerrados = useMemo(
    () => informes.filter(i => i.estado !== 'cerrado'),
    [informes]
  );

  const visitasFinalizadasHoySinInforme = useMemo(() => {
    const conInforme = new Set(informes.map(i => i.visita_id));
    return visitasHoy.filter(v => v.estado === 'finalizada' && !conInforme.has(v.id));
  }, [visitasHoy, informes]);

  // Lista de obras para el desplegable
  const obrasOptions = useMemo(() => {
    const map = new Map<string, string>();
    visitas.forEach(v => { if (v.obra_id) map.set(v.obra_id, v.obra_nombre); });
    informes.forEach(i => { if (i.obra_id) map.set(i.obra_id, i.obra_nombre); });
    return Array.from(map.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [visitas, informes]);

  // Filtrado columna visitas
  const visitasFiltradas = useMemo(() => {
    let base = visitasEnProgreso;
    if (estadoChip !== 'todos' && estadoChip !== 'en_progreso') return [];
    if (obraFilter !== 'todas') base = base.filter(v => v.obra_id === obraFilter);
    if (activeKpi === 'tiempo_excedido') {
      base = base.filter(v => minutesSince(v.fecha) / 60 > HORAS_EXCEDIDO);
    }
    const sorted = [...base];
    if (sortMode === 'tiempo_desc') sorted.sort((a, b) => minutesSince(b.fecha) - minutesSince(a.fecha));
    else if (sortMode === 'tiempo_asc') sorted.sort((a, b) => minutesSince(a.fecha) - minutesSince(b.fecha));
    else sorted.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    return sorted;
  }, [visitasEnProgreso, estadoChip, obraFilter, sortMode, activeKpi]);

  // Filtrado columna informes
  const informesFiltrados = useMemo(() => {
    if (estadoChip === 'en_progreso') return [];
    let base = informes;
    if (estadoChip === 'pendiente_revision') base = base.filter(i => i.estado === 'pendiente_revision');
    else if (estadoChip === 'borrador') base = base.filter(i => i.estado === 'borrador');
    if (obraFilter !== 'todas') base = base.filter(i => i.obra_id === obraFilter);
    if (activeKpi === 'cerrados_mes') {
      base = base.filter(i => i.estado === 'cerrado' && new Date(i.fecha) >= monthStart);
    }
    const sorted = [...base];
    if (sortMode === 'tiempo_desc') sorted.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    else if (sortMode === 'tiempo_asc') sorted.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    else sorted.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    return sorted;
  }, [informes, estadoChip, obraFilter, sortMode, activeKpi, monthStart]);

  const scrollToLists = () => {
    setTimeout(() => {
      listsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleKpiClick = (kpi: KpiKey) => {
    if (activeKpi === kpi) {
      setActiveKpi(null);
      setEstadoChip('todos');
      return;
    }
    setActiveKpi(kpi);
    if (kpi === 'visitas_hoy') {
      setEstadoChip('todos');
      setSortMode('hora_entrada');
    } else if (kpi === 'tiempo_excedido') {
      setEstadoChip('en_progreso');
      setSortMode('tiempo_desc');
    } else if (kpi === 'pendientes') {
      setEstadoChip('pendiente_revision');
    } else if (kpi === 'cerrados_mes') {
      setEstadoChip('todos');
    }
    scrollToLists();
  };

  const handleAlertClick = (kind: 'tiempo' | 'sin_cerrar' | 'sin_informe') => {
    if (kind === 'tiempo') {
      setActiveKpi('tiempo_excedido');
      setEstadoChip('en_progreso');
      setSortMode('tiempo_desc');
    } else if (kind === 'sin_cerrar') {
      setActiveKpi('pendientes');
      setEstadoChip('pendiente_revision');
    } else {
      setActiveKpi(null);
      setEstadoChip('en_progreso');
    }
    scrollToLists();
  };

  // KPI tarjeta
  const kpiCardClass = (active: boolean) =>
    `text-left w-full rounded-lg border bg-card transition-all cursor-pointer hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      active ? 'ring-2 ring-primary border-primary' : 'border-border hover:border-primary/40'
    }`;

  const chipClass = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
      active
        ? 'bg-[#fff7ed] border-[#fed7aa] text-[#c2410c]'
        : 'bg-secondary border-transparent text-secondary-foreground hover:bg-secondary/80'
    }`;

  const obraSelectActive = obraFilter !== 'todas';
  const obraSelectClass = `h-9 px-3 rounded-full text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
    obraSelectActive
      ? 'bg-[#fff7ed] border-[#fed7aa] text-[#c2410c]'
      : 'bg-card border-border text-foreground hover:border-primary/40'
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

  const visitasMostradas = showAllVisitas ? visitasFiltradas : visitasFiltradas.slice(0, 6);
  const visitasRestantes = visitasFiltradas.length - visitasMostradas.length;
  const informesMostrados = showAllInformes ? informesFiltrados : informesFiltrados.slice(0, 6);
  const informesRestantes = informesFiltrados.length - informesMostrados.length;

  const collapseVisitas = () => {
    setShowAllVisitas(false);
    listsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const collapseInformes = () => {
    setShowAllInformes(false);
    listsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            aria-pressed={activeKpi === 'visitas_hoy'}
            onClick={() => handleKpiClick('visitas_hoy')}
            className={kpiCardClass(activeKpi === 'visitas_hoy')}
          >
            <div className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <HardHat className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">{visitasHoy.length}</p>
                <p className="text-xs text-muted-foreground">Visitas hoy</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            aria-pressed={activeKpi === 'tiempo_excedido'}
            onClick={() => handleKpiClick('tiempo_excedido')}
            className={kpiCardClass(activeKpi === 'tiempo_excedido')}
          >
            <div className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <TimerReset className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">{visitasTiempoExcedido.length}</p>
                <p className="text-xs text-muted-foreground">Tiempo excedido</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            aria-pressed={activeKpi === 'pendientes'}
            onClick={() => handleKpiClick('pendientes')}
            className={kpiCardClass(activeKpi === 'pendientes')}
          >
            <div className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">{informesPendientes.length}</p>
                <p className="text-xs text-muted-foreground">Informes pendientes</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            aria-pressed={activeKpi === 'cerrados_mes'}
            onClick={() => handleKpiClick('cerrados_mes')}
            className={kpiCardClass(activeKpi === 'cerrados_mes')}
          >
            <div className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">{informesCerradosMes.length}</p>
                <p className="text-xs text-muted-foreground">Cerrados este mes</p>
              </div>
            </div>
          </button>
        </div>

        {/* Barra de filtros */}
        <div ref={listsRef} className="flex flex-wrap items-center gap-3 scroll-mt-20 sticky top-0 z-10 bg-background/80 backdrop-blur py-2 -mx-2 px-2 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {ESTADO_CHIPS.map(c => (
              <button
                key={c.value}
                onClick={() => { setEstadoChip(c.value); setActiveKpi(null); }}
                className={chipClass(estadoChip === c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <select
            value={obraFilter}
            onChange={(e) => { setObraFilter(e.target.value); setActiveKpi(null); }}
            className={obraSelectClass}
          >
            <option value="todas">Todas las obras</option>
            {obrasOptions.map(o => (
              <option key={o.id} value={o.id}>{o.nombre}</option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Ordenar</label>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="h-9 px-3 rounded-full text-sm font-medium bg-card border border-border text-foreground hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="tiempo_desc">Tiempo ↓</option>
              <option value="tiempo_asc">Tiempo ↑</option>
              <option value="hora_entrada">Hora entrada</option>
            </select>
          </div>
        </div>

        {/* Layout 2 columnas */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Visitas en progreso */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold">Visitas en progreso</h2>
              <span className="text-xs text-muted-foreground">{visitasFiltradas.length}</span>
            </div>

            {visitasFiltradas.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground text-sm">
                  Sin visitas en progreso para este filtro
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {visitasMostradas.map(v => {
                  const mins = minutesSince(v.fecha);
                  return (
                    <button
                      key={v.id}
                      onClick={() => navigate(`/admin/visita/${v.id}`)}
                      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50"
                    >
                      <Avatar className="h-9 w-9 shrink-0 bg-primary/10">
                        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                          {getInitials(v.tecnico_nombre)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-heading font-semibold text-sm truncate">{v.tecnico_nombre}</p>
                        <p className="text-xs text-muted-foreground truncate">{v.obra_nombre}</p>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className={`text-sm font-mono font-semibold ${tiempoColor(mins)}`}>
                          {formatDur(mins)}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(v.fecha), 'HH:mm', { locale: es })}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {visitasRestantes > 0 && (
                  <button
                    onClick={() => setShowAllVisitas(true)}
                    className="w-full text-sm text-primary font-medium py-2 hover:underline"
                  >
                    Ver {visitasRestantes} más →
                  </button>
                )}
                {showAllVisitas && visitasFiltradas.length > 6 && (
                  <button
                    onClick={collapseVisitas}
                    className="w-full text-sm text-primary font-medium py-2 hover:underline"
                  >
                    Mostrar menos ↑
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Informes */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold">Informes</h2>
              <span className="text-xs text-muted-foreground">{informesFiltrados.length}</span>
            </div>

            {informesFiltrados.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground text-sm">
                  {estadoChip === 'en_progreso' ? 'No aplica con este filtro' : 'No hay informes'}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {informesMostrados.map(inf => (
                  <button
                    key={inf.id}
                    onClick={() => navigate(`/admin/informe/${inf.id}`)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <FileText className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-heading font-semibold text-sm truncate">{inf.obra_nombre}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {inf.tecnico_nombre} · {format(new Date(inf.fecha), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {inf.obra_id && <ExpedienteDot status={expedienteMap[inf.obra_id] || 'sin_datos'} />}
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${informePillClass(inf.estado)}`}>
                        {informeLabel(inf.estado)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
                {informesRestantes > 0 && (
                  <button
                    onClick={() => setShowAllInformes(true)}
                    className="w-full text-sm text-primary font-medium py-2 hover:underline"
                  >
                    Ver {informesRestantes} más →
                  </button>
                )}
                {showAllInformes && informesFiltrados.length > 6 && (
                  <button
                    onClick={collapseInformes}
                    className="w-full text-sm text-primary font-medium py-2 hover:underline"
                  >
                    Mostrar menos ↑
                  </button>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Alertas */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x divide-border">
            <button
              onClick={() => handleAlertClick('tiempo')}
              className="p-4 flex items-center gap-3 text-left transition-colors hover:bg-muted/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <TimerReset className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xl font-heading font-bold">{visitasTiempoExcedido.length}</p>
                <p className="text-xs text-muted-foreground">Visitas con tiempo elevado</p>
              </div>
            </button>

            <button
              onClick={() => handleAlertClick('sin_cerrar')}
              className="p-4 flex items-center gap-3 text-left transition-colors hover:bg-muted/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                <FileWarning className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xl font-heading font-bold">{informesNoCerrados.length}</p>
                <p className="text-xs text-muted-foreground">Informes sin cerrar</p>
              </div>
            </button>

            <button
              onClick={() => handleAlertClick('sin_informe')}
              className="p-4 flex items-center gap-3 text-left transition-colors hover:bg-muted/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                <FileClock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xl font-heading font-bold">{visitasFinalizadasHoySinInforme.length}</p>
                <p className="text-xs text-muted-foreground">Visitas hoy sin informe</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
