import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import DocumentoStatusBadge from '@/components/documentos/DocumentoStatusBadge';
import NuevoDocumentoDialog from '@/components/documentos/NuevoDocumentoDialog';
import AdjuntarDocumentoDialog from '@/components/documentos/AdjuntarDocumentoDialog';
import { TIPO_DOCUMENTO_LABELS, TipoDocumento } from '@/types/documentos';
import { ESTADO_LABELS } from '@/hooks/useDocumentosObra';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Download, Eye, CheckCircle, Trash2, Plus, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

interface DocRow {
  id: string;
  obra_id: string;
  tipo: string;
  estado: string;
  titulo: string | null;
  fecha_documento: string | null;
  nombre_coordinador: string | null;
  archivo_url: string | null;
  archivo_nombre: string | null;
  created_at: string | null;
  obras: { nombre: string } | null;
}

interface ObraMin { id: string; nombre: string; }

const TIPOS_ALL = Object.keys(TIPO_DOCUMENTO_LABELS) as TipoDocumento[];
const ESTADOS_ALL = ['pendiente', 'generado', 'adjuntado', 'firmado'] as const;

export default function AdminDocumentos() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [obras, setObras] = useState<ObraMin[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterObra, setFilterObra] = useState('__all');
  const [filterTipos, setFilterTipos] = useState<string[]>([]);
  const [filterEstados, setFilterEstados] = useState<string[]>([]);
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>();
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>();

  // Nuevo documento
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [nuevoObraId, setNuevoObraId] = useState('');
  const [selectObraOpen, setSelectObraOpen] = useState(false);
  const [selectObraTemp, setSelectObraTemp] = useState('');

  // Adjuntar
  const [adjuntarOpen, setAdjuntarOpen] = useState(false);
  const [adjuntarDocId, setAdjuntarDocId] = useState('');
  const [adjuntarObraId, setAdjuntarObraId] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: docsData }, { data: obrasData }] = await Promise.all([
      supabase.from('documentos_obra')
        .select('id, obra_id, tipo, estado, titulo, fecha_documento, nombre_coordinador, archivo_url, archivo_nombre, created_at, obras(nombre)')
        .order('created_at', { ascending: false }),
      supabase.from('obras').select('id, nombre').order('nombre'),
    ]);
    setDocs((docsData as DocRow[] | null) || []);
    setObras(obrasData || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    let r = docs;
    if (filterObra !== '__all') r = r.filter(d => d.obra_id === filterObra);
    if (filterTipos.length) r = r.filter(d => filterTipos.includes(d.tipo));
    if (filterEstados.length) r = r.filter(d => filterEstados.includes(d.estado));
    if (fechaDesde) r = r.filter(d => d.fecha_documento && new Date(d.fecha_documento) >= fechaDesde);
    if (fechaHasta) r = r.filter(d => d.fecha_documento && new Date(d.fecha_documento) <= fechaHasta);
    return r;
  }, [docs, filterObra, filterTipos, filterEstados, fechaDesde, fechaHasta]);

  const stats = useMemo(() => ({
    total: filtered.length,
    pendientes: filtered.filter(d => d.estado === 'pendiente').length,
    generados: filtered.filter(d => d.estado === 'generado' || d.estado === 'adjuntado').length,
    firmados: filtered.filter(d => d.estado === 'firmado').length,
  }), [filtered]);

  const marcarFirmado = async (id: string) => {
    const { error } = await supabase.from('documentos_obra').update({ estado: 'firmado' as any }).eq('id', id);
    if (error) { toast.error('Error al actualizar'); return; }
    toast.success('Marcado como firmado');
    fetchAll();
  };

  const eliminar = async (id: string) => {
    const { error } = await supabase.from('documentos_obra').delete().eq('id', id);
    if (error) { toast.error('Error al eliminar'); return; }
    toast.success('Documento eliminado');
    fetchAll();
  };

  const toggleFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">Documentos de Obra</h2>
          <Button
            onClick={() => {
              if (filterObra !== '__all') {
                setNuevoObraId(filterObra);
                setNuevoOpen(true);
              } else {
                setSelectObraTemp('');
                setSelectObraOpen(true);
              }
            }}
            className="h-12 rounded-xl gap-2"
          >
            <Plus className="h-5 w-5" /> Nuevo documento
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
          <Card className="border-destructive/30"><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-destructive">{stats.pendientes}</p><p className="text-xs text-muted-foreground">Pendientes</p></CardContent></Card>
          <Card className="border-warning/30"><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-warning">{stats.generados}</p><p className="text-xs text-muted-foreground">Generados</p></CardContent></Card>
          <Card className="border-success/30"><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-success">{stats.firmados}</p><p className="text-xs text-muted-foreground">Firmados</p></CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Obra</label>
            <Select value={filterObra} onValueChange={setFilterObra}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todas las obras</SelectItem>
                {obras.map(o => <SelectItem key={o.id} value={o.id}>{o.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">Tipo {filterTipos.length > 0 && `(${filterTipos.length})`}</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 max-h-64 overflow-y-auto">
              {TIPOS_ALL.map(t => (
                <label key={t} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                  <Checkbox checked={filterTipos.includes(t)} onCheckedChange={() => toggleFilter(filterTipos, t, setFilterTipos)} />
                  {TIPO_DOCUMENTO_LABELS[t]}
                </label>
              ))}
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">Estado {filterEstados.length > 0 && `(${filterEstados.length})`}</Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              {ESTADOS_ALL.map(e => (
                <label key={e} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                  <Checkbox checked={filterEstados.includes(e)} onCheckedChange={() => toggleFilter(filterEstados, e, setFilterEstados)} />
                  {ESTADO_LABELS[e] || e}
                </label>
              ))}
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn(!fechaDesde && 'text-muted-foreground')}>
                <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                {fechaDesde ? format(fechaDesde, 'dd/MM/yy') : 'Desde'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fechaDesde} onSelect={setFechaDesde} className="p-3 pointer-events-auto" /></PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn(!fechaHasta && 'text-muted-foreground')}>
                <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                {fechaHasta ? format(fechaHasta, 'dd/MM/yy') : 'Hasta'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fechaHasta} onSelect={setFechaHasta} className="p-3 pointer-events-auto" /></PopoverContent>
          </Popover>

          {(filterObra !== '__all' || filterTipos.length || filterEstados.length || fechaDesde || fechaHasta) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterObra('__all'); setFilterTipos([]); setFilterEstados([]); setFechaDesde(undefined); setFechaHasta(undefined); }}>
              Limpiar
            </Button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-muted-foreground text-sm">Cargando…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obra</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Coordinador</TableHead>
                <TableHead>Archivo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Sin documentos</TableCell></TableRow>
              )}
              {filtered.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.obras?.nombre || '—'}</TableCell>
                  <TableCell className="text-sm">{TIPO_DOCUMENTO_LABELS[d.tipo as TipoDocumento] || d.tipo}</TableCell>
                  <TableCell><DocumentoStatusBadge estado={d.estado} /></TableCell>
                  <TableCell className="text-sm">{d.fecha_documento ? format(new Date(d.fecha_documento), 'dd/MM/yyyy') : '—'}</TableCell>
                  <TableCell className="text-sm">{d.nombre_coordinador || '—'}</TableCell>
                  <TableCell>
                    {d.archivo_url ? (
                      <a href={d.archivo_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                        <Download className="h-4 w-4" /> {d.archivo_nombre || 'Descargar'}
                      </a>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" title="Ver detalle" onClick={() => navigate(`/admin/documento/${d.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!d.archivo_url && (
                      <Button variant="ghost" size="icon" title="Adjuntar archivo" onClick={() => { setAdjuntarDocId(d.id); setAdjuntarObraId(d.obra_id); setAdjuntarOpen(true); }}>
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    )}
                    {d.estado !== 'firmado' && (
                      <Button variant="ghost" size="icon" title="Marcar firmado" onClick={() => marcarFirmado(d.id)}>
                        <CheckCircle className="h-4 w-4 text-success" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Eliminar">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                          <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => eliminar(d.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Select obra dialog (when no filter active) */}
      <Dialog open={selectObraOpen} onOpenChange={setSelectObraOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Seleccionar obra</DialogTitle>
          </DialogHeader>
          <Select value={selectObraTemp} onValueChange={setSelectObraTemp}>
            <SelectTrigger><SelectValue placeholder="Elige una obra" /></SelectTrigger>
            <SelectContent>
              {obras.map(o => <SelectItem key={o.id} value={o.id}>{o.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              disabled={!selectObraTemp}
              onClick={() => { setNuevoObraId(selectObraTemp); setSelectObraOpen(false); setNuevoOpen(true); }}
              className="h-12 rounded-xl"
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {nuevoObraId && (
        <NuevoDocumentoDialog
          open={nuevoOpen}
          onOpenChange={setNuevoOpen}
          obraId={nuevoObraId}
          onCreated={() => fetchAll()}
        />
      )}

      {adjuntarDocId && (
        <AdjuntarDocumentoDialog
          open={adjuntarOpen}
          onOpenChange={open => { setAdjuntarOpen(open); if (!open) fetchAll(); }}
          documentoId={adjuntarDocId}
          obraId={adjuntarObraId}
        />
      )}
    </AdminLayout>
  );
}
