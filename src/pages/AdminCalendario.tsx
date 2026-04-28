import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Plus, Trash2, Save, AlertTriangle, HardHat, User as UserIcon, Check } from 'lucide-react';
import {
  addDays, startOfWeek, endOfWeek, format, isSameDay, getISOWeek, isSameWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

// ---------- types ----------
type EstadoVisita = 'finalizada' | 'en_progreso' | 'programada' | 'pendiente_confirmar' | 'cancelada';

interface Obra { id: string; nombre: string; }
interface Tecnico { id: string; nombre: string; apellidos: string; user_id: string | null; }
interface Visita {
  id: string;
  fecha: string;
  estado: string;
  obra_id: string;
  usuario_id: string;
}

type Pivot = 'obra' | 'tecnico';

// ---------- helpers ----------
const ESTADO_META: Record<string, { label: string; chip: string; dot: string }> = {
  finalizada:          { label: 'Realizada',            chip: 'bg-green-100 text-green-800 border border-green-200',    dot: 'bg-green-500'   },
  en_progreso:         { label: 'En progreso',          chip: 'bg-green-100 text-green-800 border border-green-300 ring-2 ring-green-300/40', dot: 'bg-green-500' },
  programada:          { label: 'Programada',           chip: 'bg-blue-100 text-blue-800 border border-blue-200',       dot: 'bg-blue-500'    },
  pendiente_confirmar: { label: 'Pendiente confirmar',  chip: 'bg-yellow-100 text-yellow-800 border border-yellow-200', dot: 'bg-yellow-500'  },
  cancelada:           { label: 'Cancelada',            chip: 'bg-muted text-muted-foreground border border-border line-through', dot: 'bg-muted-foreground' },
};

function shortName(full: string) {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 8);
  return `${parts[0].slice(0, 1)}. ${parts[parts.length - 1]}`;
}

// ---------- main page ----------
export default function AdminCalendario() {
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [pivot, setPivot] = useState<Pivot>('obra');
  const [filtroId, setFiltroId] = useState<string>('todas');

  const [obras, setObras] = useState<Obra[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [tecObras, setTecObras] = useState<{ tecnico_id: string; obra_id: string }[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedVisita, setSelectedVisita] = useState<Visita | null>(null);
  const [nuevaCtx, setNuevaCtx] = useState<{ fecha: Date; obraId?: string; tecnicoId?: string; modoInicial: Pivot } | null>(null);

  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // ---- load static
  useEffect(() => {
    (async () => {
      const [obrasRes, tecRes, linksRes] = await Promise.all([
        supabase.from('obras').select('id, nombre').order('nombre'),
        supabase.from('tecnicos').select('id, nombre, apellidos, user_id').order('nombre'),
        supabase.from('tecnicos_obras').select('tecnico_id, obra_id'),
      ]);
      setObras((obrasRes.data || []) as Obra[]);
      setTecnicos((tecRes.data || []) as Tecnico[]);
      setTecObras((linksRes.data || []) as any);
    })();
  }, []);

  // ---- load visitas for the active week
  const fetchVisitas = async () => {
    setLoading(true);
    const start = weekStart.toISOString();
    const end = addDays(weekEnd, 1).toISOString();
    const { data, error } = await supabase
      .from('visitas')
      .select('id, fecha, estado, obra_id, usuario_id')
      .gte('fecha', start)
      .lt('fecha', end);
    if (error) toast.error('No se pudieron cargar las visitas');
    setVisitas((data || []) as Visita[]);
    setLoading(false);
  };
  useEffect(() => { fetchVisitas(); /* eslint-disable-next-line */ }, [weekStart]);

  // ---- maps
  const tecByUserId = useMemo(() => {
    const m = new Map<string, Tecnico>();
    tecnicos.forEach(t => { if (t.user_id) m.set(t.user_id, t); });
    return m;
  }, [tecnicos]);

  const tecnicosByObra = useMemo(() => {
    const m: Record<string, string[]> = {};
    tecObras.forEach(l => { (m[l.obra_id] ||= []).push(l.tecnico_id); });
    return m;
  }, [tecObras]);

  const obrasByTecnico = useMemo(() => {
    const m: Record<string, string[]> = {};
    tecObras.forEach(l => { (m[l.tecnico_id] ||= []).push(l.obra_id); });
    return m;
  }, [tecObras]);

  const obraName = (id: string) => obras.find(o => o.id === id)?.nombre || '—';
  const tecName = (t: Tecnico) => `${t.nombre} ${t.apellidos}`.trim();

  // ---- rows depending on pivot + filtro
  const rows = useMemo(() => {
    if (pivot === 'obra') {
      const list = filtroId === 'todas' ? obras : obras.filter(o => o.id === filtroId);
      return list.map(o => {
        const tecIds = tecnicosByObra[o.id] || [];
        const subtitulo = tecIds
          .map(id => tecnicos.find(t => t.id === id))
          .filter(Boolean).map(t => tecName(t!)).join(', ') || 'Sin técnicos asignados';
        return { id: o.id, titulo: o.nombre, subtitulo };
      });
    } else {
      const list = filtroId === 'todas' ? tecnicos : tecnicos.filter(t => t.id === filtroId);
      return list.map(t => {
        const obraIds = obrasByTecnico[t.id] || [];
        const subtitulo = obraIds.map(obraName).join(', ') || 'Sin obras asignadas';
        return { id: t.id, titulo: tecName(t), subtitulo };
      });
    }
  }, [pivot, filtroId, obras, tecnicos, tecnicosByObra, obrasByTecnico]);

  // ---- visit lookup per (rowId, dayIndex)
  const cellMap = useMemo(() => {
    const m = new Map<string, Visita[]>();
    visitas.forEach(v => {
      const d = new Date(v.fecha);
      const dayIdx = days.findIndex(day => isSameDay(day, d));
      if (dayIdx < 0) return;
      let rowId: string | undefined;
      if (pivot === 'obra') {
        rowId = v.obra_id;
      } else {
        const tec = tecByUserId.get(v.usuario_id);
        rowId = tec?.id;
      }
      if (!rowId) return;
      const key = `${rowId}|${dayIdx}`;
      (m.get(key) || m.set(key, []).get(key)!).push(v);
    });
    return m;
  }, [visitas, days, pivot, tecByUserId]);

  // ---- header label
  const weekLabel = `Semana ${getISOWeek(weekStart)} · ${format(weekStart, 'd MMM', { locale: es })} – ${format(weekEnd, 'd MMM', { locale: es })}`;
  const isCurrentWeek = isSameWeek(weekStart, new Date(), { weekStartsOn: 1 });

  // ---- chip label
  const chipLabel = (v: Visita) => {
    if (pivot === 'obra') {
      const t = tecByUserId.get(v.usuario_id);
      return t ? shortName(tecName(t)) : '—';
    }
    return shortName(obraName(v.obra_id));
  };
  const chipFullName = (v: Visita) => {
    if (pivot === 'obra') {
      const t = tecByUserId.get(v.usuario_id);
      return t ? tecName(t) : 'Sin técnico';
    }
    return obraName(v.obra_id);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 px-2">
              <CalIcon className="h-4 w-4 text-primary" />
              <span className="font-heading font-semibold">{weekLabel}</span>
              {isCurrentWeek && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Actual</span>}
            </div>
            <Button size="icon" variant="ghost" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            >
              Hoy
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* PIVOT TOGGLE */}
            <div className="inline-flex rounded-full bg-secondary p-1">
              {(['obra', 'tecnico'] as Pivot[]).map(p => {
                const active = pivot === p;
                return (
                  <button
                    key={p}
                    onClick={() => { setPivot(p); setFiltroId('todas'); }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      active ? 'bg-primary text-primary-foreground shadow' : 'text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {p === 'obra' ? 'Por obra' : 'Por técnico'}
                  </button>
                );
              })}
            </div>

            {/* CONTEXTUAL FILTER */}
            <Select value={filtroId} onValueChange={setFiltroId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder={pivot === 'obra' ? 'Todas las obras' : 'Todos los técnicos'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">{pivot === 'obra' ? 'Todas las obras' : 'Todos los técnicos'}</SelectItem>
                {pivot === 'obra'
                  ? obras.map(o => <SelectItem key={o.id} value={o.id}>{o.nombre}</SelectItem>)
                  : tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{tecName(t)}</SelectItem>)
                }
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* LEGEND */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg bg-card border border-border px-4 py-2 text-sm">
          {(['finalizada', 'programada', 'pendiente_confirmar'] as const).map(s => (
            <div key={s} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${ESTADO_META[s].dot}`} />
              <span className="text-muted-foreground">{ESTADO_META[s].label}</span>
            </div>
          ))}
        </div>

        {/* GRID */}
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="sticky left-0 z-10 w-[170px] min-w-[170px] bg-muted/40 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {pivot === 'obra' ? 'Obra' : 'Técnico'}
                </th>
                {days.map((d, i) => {
                  const today = isSameDay(d, new Date());
                  return (
                    <th key={i} className={`px-2 py-2 text-center text-xs font-semibold ${today ? 'bg-orange-50 text-primary' : 'text-muted-foreground'}`}>
                      <div className="uppercase">{format(d, 'EEE', { locale: es })}</div>
                      <div className="text-base font-bold text-foreground">{format(d, 'd', { locale: es })}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Cargando...</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Sin resultados</td></tr>
              )}
              {!loading && rows.map(r => (
                <tr key={r.id} className="border-b border-border last:border-b-0">
                  <td className="sticky left-0 z-10 w-[170px] min-w-[170px] bg-card px-3 py-3 align-top">
                    <button
                      className="text-left font-semibold text-foreground hover:text-primary truncate w-full"
                      onClick={() => navigate(pivot === 'obra' ? '/admin/obras' : '/admin/tecnicos')}
                      title={r.titulo}
                    >
                      {r.titulo}
                    </button>
                    <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{r.subtitulo}</div>
                  </td>
                  {days.map((d, i) => {
                    const today = isSameDay(d, new Date());
                    const items = cellMap.get(`${r.id}|${i}`) || [];
                    return (
                      <td
                        key={i}
                        className={`min-w-[110px] border-l border-border px-1.5 py-1.5 align-top ${today ? 'bg-orange-50/60' : ''}`}
                      >
                        <div className="flex flex-col gap-1">
                          {items.map(v => {
                            const meta = ESTADO_META[v.estado] || ESTADO_META.programada;
                            return (
                              <Tooltip key={v.id}>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => setSelectedVisita(v)}
                                    className={`w-full truncate rounded-md px-2 py-1 text-left text-xs font-medium ${meta.chip} hover:opacity-90`}
                                  >
                                    {chipLabel(v)}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <div className="font-semibold">{chipFullName(v)}</div>
                                    <div className="text-muted-foreground">{meta.label} · {format(new Date(v.fecha), 'HH:mm')}</div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                          <button
                            onClick={() => setNuevaCtx({
                              fecha: d,
                              obraId: pivot === 'obra' ? r.id : undefined,
                              tecnicoId: pivot === 'tecnico' ? r.id : undefined,
                              modoInicial: pivot,
                            })}
                            className="flex items-center justify-center rounded-md border border-dashed border-border/60 py-1 text-[11px] text-muted-foreground/60 hover:border-primary hover:text-primary transition-colors"
                            style={{ opacity: items.length === 0 ? 1 : 0.35 }}
                            title="Nueva visita"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW VISIT DIALOG */}
      <NuevaVisitaDialog
        ctx={nuevaCtx}
        obras={obras}
        tecnicos={tecnicos}
        tecnicosByObra={tecnicosByObra}
        obrasByTecnico={obrasByTecnico}
        tecByUserId={tecByUserId}
        visitasSemana={visitas}
        onClose={() => setNuevaCtx(null)}
        onCreated={() => { setNuevaCtx(null); fetchVisitas(); }}
      />

      {/* DETAIL SHEET */}
      <VisitaDetalleSheet
        visita={selectedVisita}
        obras={obras}
        tecnicos={tecnicos}
        tecByUserId={tecByUserId}
        visitasSemana={visitas}
        onClose={() => setSelectedVisita(null)}
        onChanged={() => { setSelectedVisita(null); fetchVisitas(); }}
      />
    </AdminLayout>
  );
}

// ---------- Nueva visita ----------
function NuevaVisitaDialog({
  ctx, obras, tecnicos, onClose, onCreated,
}: {
  ctx: { fecha: Date; obraId?: string; tecnicoId?: string } | null;
  obras: Obra[];
  tecnicos: Tecnico[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [obraId, setObraId] = useState('');
  const [tecnicoId, setTecnicoId] = useState('');
  const [hora, setHora] = useState('09:00');
  const [estado, setEstado] = useState<EstadoVisita>('programada');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ctx) {
      setObraId(ctx.obraId || '');
      setTecnicoId(ctx.tecnicoId || '');
      setHora('09:00');
      setEstado('programada');
    }
  }, [ctx]);

  const open = !!ctx;
  if (!ctx) return null;

  const submit = async () => {
    if (!obraId || !tecnicoId) {
      toast.error('Selecciona obra y técnico');
      return;
    }
    const tec = tecnicos.find(t => t.id === tecnicoId);
    if (!tec?.user_id) {
      toast.error('El técnico no tiene usuario asignado');
      return;
    }
    setSaving(true);
    const [hh, mm] = hora.split(':').map(Number);
    const fecha = new Date(ctx.fecha);
    fecha.setHours(hh || 9, mm || 0, 0, 0);
    const { error } = await supabase.from('visitas').insert({
      obra_id: obraId,
      usuario_id: tec.user_id,
      fecha: fecha.toISOString(),
      estado,
    });
    setSaving(false);
    if (error) {
      toast.error('Error al crear la visita');
      return;
    }
    toast.success('Visita creada');
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva visita</DialogTitle>
          <p className="text-sm text-muted-foreground">{format(ctx.fecha, "EEEE d 'de' MMMM", { locale: es })}</p>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Obra</Label>
            <Select value={obraId} onValueChange={setObraId}>
              <SelectTrigger><SelectValue placeholder="Selecciona obra" /></SelectTrigger>
              <SelectContent>
                {obras.map(o => <SelectItem key={o.id} value={o.id}>{o.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Técnico</Label>
            <Select value={tecnicoId} onValueChange={setTecnicoId}>
              <SelectTrigger><SelectValue placeholder="Selecciona técnico" /></SelectTrigger>
              <SelectContent>
                {tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre} {t.apellidos}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Hora</Label>
              <Input type="time" value={hora} onChange={e => setHora(e.target.value)} />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={estado} onValueChange={v => setEstado(v as EstadoVisita)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="programada">Programada</SelectItem>
                  <SelectItem value="pendiente_confirmar">Pendiente confirmar</SelectItem>
                  <SelectItem value="finalizada">Realizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Detalle (Sheet) ----------
function VisitaDetalleSheet({
  visita, obras, tecnicos, tecByUserId, onClose, onChanged,
}: {
  visita: Visita | null;
  obras: Obra[];
  tecnicos: Tecnico[];
  tecByUserId: Map<string, Tecnico>;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [obraId, setObraId] = useState('');
  const [tecnicoId, setTecnicoId] = useState('');
  const [fechaStr, setFechaStr] = useState('');
  const [horaStr, setHoraStr] = useState('');
  const [estado, setEstado] = useState<EstadoVisita>('programada');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visita) return;
    setObraId(visita.obra_id);
    const t = tecByUserId.get(visita.usuario_id);
    setTecnicoId(t?.id || '');
    const d = new Date(visita.fecha);
    setFechaStr(format(d, 'yyyy-MM-dd'));
    setHoraStr(format(d, 'HH:mm'));
    setEstado((visita.estado as EstadoVisita) || 'programada');
  }, [visita, tecByUserId]);

  if (!visita) return null;

  const guardar = async () => {
    const tec = tecnicos.find(t => t.id === tecnicoId);
    if (!tec?.user_id) { toast.error('Técnico inválido'); return; }
    setSaving(true);
    const [y, mo, d] = fechaStr.split('-').map(Number);
    const [hh, mm] = horaStr.split(':').map(Number);
    const fecha = new Date(y, (mo || 1) - 1, d || 1, hh || 0, mm || 0);
    const { error } = await supabase
      .from('visitas')
      .update({
        obra_id: obraId,
        usuario_id: tec.user_id,
        fecha: fecha.toISOString(),
        estado,
      })
      .eq('id', visita.id);
    setSaving(false);
    if (error) { toast.error('Error al guardar'); return; }
    toast.success('Visita actualizada');
    onChanged();
  };

  const cancelar = async () => {
    if (!confirm('¿Cancelar esta visita?')) return;
    const { error } = await supabase
      .from('visitas')
      .update({ estado: 'cancelada' })
      .eq('id', visita.id);
    if (error) { toast.error('No se pudo cancelar'); return; }
    toast.success('Visita cancelada');
    onChanged();
  };

  return (
    <Sheet open={!!visita} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Detalle de visita</SheetTitle>
          <SheetDescription>
            {format(new Date(visita.fecha), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          <div>
            <Label>Obra</Label>
            <Select value={obraId} onValueChange={setObraId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {obras.map(o => <SelectItem key={o.id} value={o.id}>{o.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Técnico</Label>
            <Select value={tecnicoId} onValueChange={setTecnicoId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre} {t.apellidos}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={fechaStr} onChange={e => setFechaStr(e.target.value)} />
            </div>
            <div>
              <Label>Hora</Label>
              <Input type="time" value={horaStr} onChange={e => setHoraStr(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Estado</Label>
            <Select value={estado} onValueChange={v => setEstado(v as EstadoVisita)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="programada">Programada</SelectItem>
                <SelectItem value="pendiente_confirmar">Pendiente confirmar</SelectItem>
                <SelectItem value="en_progreso">En progreso</SelectItem>
                <SelectItem value="finalizada">Realizada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={guardar} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> Guardar cambios
          </Button>
          <Button variant="outline" onClick={cancelar} className="text-destructive border-destructive/40 hover:bg-destructive/10">
            <Trash2 className="h-4 w-4 mr-1" /> Cancelar visita
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
