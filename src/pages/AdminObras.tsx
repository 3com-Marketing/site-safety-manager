import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, HardHat, Users, Eye, Search, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import MapPicker from '@/components/MapPicker';
import { geocodeAddress } from '@/lib/geo';
import { calcExpedienteStatus, ExpedienteDot, type ExpedienteStatus } from '@/lib/expedienteStatus';
import DocumentosList from '@/components/documentos/DocumentosList';

interface Obra {
  id: string;
  nombre: string;
  direccion: string;
  cliente_id: string;
  cliente_nombre?: string;
  tecnicoNames?: string[];
  latitud?: number | null;
  longitud?: number | null;
}

interface Cliente {
  id: string;
  nombre: string;
}

interface TecnicoMin {
  id: string;
  nombre: string;
}

export default function AdminObras() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [allTecnicos, setAllTecnicos] = useState<TecnicoMin[]>([]);
  const [obraTecLinks, setObraTecLinks] = useState<Record<string, string[]>>({}); // obra_id -> tecnico_id[]
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [selectedTecnicos, setSelectedTecnicos] = useState<string[]>([]);
  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Obra | null>(null);
  const [viewObra, setViewObra] = useState<Obra | null>(null);
  const [expedienteMap, setExpedienteMap] = useState<Record<string, ExpedienteStatus>>({});

  const fetchData = async () => {
    const [obrasRes, clientesRes, { data: tecData }, { data: links }, { data: docsData }] = await Promise.all([
      supabase.from('obras').select('id, nombre, direccion, cliente_id, latitud, longitud, clientes(nombre)').order('nombre'),
      supabase.from('clientes').select('id, nombre').order('nombre'),
      supabase.from('tecnicos').select('id, nombre').order('nombre'),
      supabase.from('tecnicos_obras').select('tecnico_id, obra_id'),
      supabase.from('documentos_obra').select('obra_id, tipo, estado'),
    ]);

    const tecList = (tecData || []) as TecnicoMin[];
    setAllTecnicos(tecList);

    const tecMap = new Map<string, string>();
    tecList.forEach(t => tecMap.set(t.id, t.nombre));

    const byObra: Record<string, string[]> = {};
    const namesByObra: Record<string, string[]> = {};
    (links || []).forEach((l: any) => {
      if (!byObra[l.obra_id]) byObra[l.obra_id] = [];
      byObra[l.obra_id].push(l.tecnico_id);
      if (!namesByObra[l.obra_id]) namesByObra[l.obra_id] = [];
      const name = tecMap.get(l.tecnico_id);
      if (name) namesByObra[l.obra_id].push(name);
    });
    setObraTecLinks(byObra);

    setObras(
      (obrasRes.data || []).map((o: any) => ({
        id: o.id,
        nombre: o.nombre,
        direccion: o.direccion,
        cliente_id: o.cliente_id,
        cliente_nombre: o.clientes?.nombre || '',
        tecnicoNames: namesByObra[o.id] || [],
        latitud: o.latitud,
        longitud: o.longitud,
      }))
    );
    setClientes(clientesRes.data || []);

    // Build expediente status map
    const docsByObra: Record<string, { tipo: string; estado: string }[]> = {};
    (docsData || []).forEach((d: any) => {
      if (!docsByObra[d.obra_id]) docsByObra[d.obra_id] = [];
      docsByObra[d.obra_id].push({ tipo: d.tipo, estado: d.estado });
    });
    const expMap: Record<string, ExpedienteStatus> = {};
    Object.entries(docsByObra).forEach(([obraId, docs]) => {
      expMap[obraId] = calcExpedienteStatus(docs);
    });
    setExpedienteMap(expMap);

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditingObra(null);
    setNombre('');
    setDireccion('');
    setClienteId('');
    setSelectedTecnicos([]);
    setLatitud(null);
    setLongitud(null);
    setDialogOpen(true);
  };

  const openEdit = (o: Obra) => {
    setEditingObra(o);
    setNombre(o.nombre);
    setDireccion(o.direccion);
    setClienteId(o.cliente_id);
    setSelectedTecnicos(obraTecLinks[o.id] || []);
    setLatitud(o.latitud ?? null);
    setLongitud(o.longitud ?? null);
    setDialogOpen(true);
  };

  const toggleTecnico = (tecId: string) => {
    setSelectedTecnicos(prev => prev.includes(tecId) ? prev.filter(id => id !== tecId) : [...prev, tecId]);
  };

  const handleSave = async () => {
    if (!nombre.trim() || !clienteId) return;
    setSaving(true);
    const payload = { nombre: nombre.trim(), direccion: direccion.trim(), cliente_id: clienteId, latitud, longitud };

    let obraId: string;

    if (editingObra) {
      const { error } = await supabase.from('obras').update(payload).eq('id', editingObra.id);
      if (error) { toast.error('Error al actualizar'); setSaving(false); return; }
      obraId = editingObra.id;
    } else {
      const { data, error } = await supabase.from('obras').insert(payload).select('id').single();
      if (error || !data) { toast.error('Error al crear'); setSaving(false); return; }
      obraId = data.id;
    }

    // Sync tecnicos links
    await supabase.from('tecnicos_obras').delete().eq('obra_id', obraId);
    if (selectedTecnicos.length > 0) {
      await supabase.from('tecnicos_obras').insert(
        selectedTecnicos.map(tecnico_id => ({ tecnico_id, obra_id: obraId }))
      );
    }

    toast.success(editingObra ? 'Obra actualizada' : 'Obra creada');
    setSaving(false);
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('obras').delete().eq('id', deleteTarget.id);
    if (error) toast.error('Error al eliminar. ¿Tiene visitas asociadas?');
    else toast.success('Obra eliminada');
    setDeleteTarget(null);
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">Obras</h2>
          <Button onClick={openCreate} className="h-12 rounded-xl gap-2">
            <Plus className="h-5 w-5" /> Nueva obra
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : obras.length === 0 ? (
          <p className="text-muted-foreground">No hay obras registradas</p>
        ) : (
          <div className="space-y-2">
            {obras.map(o => (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <HardHat className="h-5 w-5 text-secondary-foreground" />
                  </div>
                   <div>
                    <div className="flex items-center gap-2">
                      <ExpedienteDot status={expedienteMap[o.id] || 'sin_datos'} />
                      <p className="font-heading font-semibold">{o.nombre}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{o.cliente_nombre} · {o.direccion || 'Sin dirección'}</p>
                    {o.tecnicoNames && o.tecnicoNames.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {o.tecnicoNames.map((name, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                            <Users className="h-3 w-3" />{name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setViewObra(o)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(o)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(o)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingObra ? 'Editar obra' : 'Nueva obra'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input placeholder="Nombre de la obra" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <div className="flex gap-2">
                <Input placeholder="Dirección" value={direccion} onChange={e => setDireccion(e.target.value)} className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={!direccion.trim() || geocoding}
                  onClick={async () => {
                    setGeocoding(true);
                    const result = await geocodeAddress(direccion.trim());
                    if (result) {
                      setLatitud(result.lat);
                      setLongitud(result.lng);
                      toast.success('Dirección localizada en el mapa');
                    } else {
                      toast.error('No se encontró la dirección');
                    }
                    setGeocoding(false);
                  }}
                  title="Buscar en mapa"
                >
                  {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Técnicos assignment */}
            <div className="space-y-2">
              <Label>Técnicos asignados</Label>
              {allTecnicos.length === 0 ? (
                <p className="text-xs text-muted-foreground">No hay técnicos creados</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto rounded-lg border border-border p-3">
                  {allTecnicos.map(t => (
                    <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedTecnicos.includes(t.id)}
                        onCheckedChange={() => toggleTecnico(t.id)}
                      />
                      <span className="text-sm">{t.nombre}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Ubicación en mapa */}
            <div className="space-y-2">
              <Label>Ubicación en mapa</Label>
              <MapPicker
                lat={latitud}
                lng={longitud}
                onSelect={(lat, lng) => { setLatitud(lat); setLongitud(lng); }}
              />
              {latitud && longitud && (
                <p className="text-xs text-muted-foreground">📍 {latitud.toFixed(5)}, {longitud.toFixed(5)}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving || !nombre.trim() || !clienteId} className="h-12 rounded-xl">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar obra?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará «{deleteTarget?.nombre}». Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View dialog */}
      <Dialog open={!!viewObra} onOpenChange={open => !open && setViewObra(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ficha de la obra</DialogTitle>
          </DialogHeader>
          {viewObra && (
            <div className="space-y-3 text-sm">
              <div><span className="font-semibold">Nombre:</span> {viewObra.nombre}</div>
              <div><span className="font-semibold">Dirección:</span> {viewObra.direccion || '—'}</div>
              <div><span className="font-semibold">Cliente:</span> {viewObra.cliente_nombre || '—'}</div>
              <div>
                <span className="font-semibold">Técnicos asignados:</span>
                {viewObra.tecnicoNames && viewObra.tecnicoNames.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewObra.tecnicoNames.map((name, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                        <Users className="h-3 w-3" />{name}
                      </span>
                    ))}
                  </div>
                ) : <span className="text-muted-foreground ml-1">Ninguno</span>}
              </div>
              {viewObra.latitud && viewObra.longitud && (
                <div>
                  <span className="font-semibold">Ubicación:</span>
                  <MapPicker lat={viewObra.latitud} lng={viewObra.longitud} readOnly className="mt-2" />
                </div>
              )}
              <div className="border-t border-border pt-4 mt-4">
                <DocumentosList obraId={viewObra.id} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
