import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, HardHat } from 'lucide-react';
import { toast } from 'sonner';

interface Obra {
  id: string;
  nombre: string;
  direccion: string;
  cliente_id: string;
  cliente_nombre?: string;
  tecnicos?: string[];
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
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Obra | null>(null);

  const fetchData = async () => {
    const [obrasRes, clientesRes, { data: tecData }, { data: links }] = await Promise.all([
      supabase.from('obras').select('id, nombre, direccion, cliente_id, clientes(nombre)').order('nombre'),
      supabase.from('clientes').select('id, nombre').order('nombre'),
      supabase.from('tecnicos').select('id, nombre').order('nombre'),
      supabase.from('tecnicos_obras').select('tecnico_id, obra_id'),
    ]);

    const tecMap = new Map<string, string>();
    (tecData || []).forEach((t: any) => tecMap.set(t.id, t.nombre));

    const obraLinks: Record<string, string[]> = {};
    (links || []).forEach((l: any) => {
      if (!obraLinks[l.obra_id]) obraLinks[l.obra_id] = [];
      const name = tecMap.get(l.tecnico_id);
      if (name) obraLinks[l.obra_id].push(name);
    });

    setObras(
      (obrasRes.data || []).map((o: any) => ({
        id: o.id,
        nombre: o.nombre,
        direccion: o.direccion,
        cliente_id: o.cliente_id,
        cliente_nombre: o.clientes?.nombre || '',
        tecnicos: obraLinks[o.id] || [],
      }))
    );
    setClientes(clientesRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditingObra(null);
    setNombre('');
    setDireccion('');
    setClienteId('');
    setDialogOpen(true);
  };

  const openEdit = (o: Obra) => {
    setEditingObra(o);
    setNombre(o.nombre);
    setDireccion(o.direccion);
    setClienteId(o.cliente_id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nombre.trim() || !clienteId) return;
    setSaving(true);
    const payload = { nombre: nombre.trim(), direccion: direccion.trim(), cliente_id: clienteId };
    if (editingObra) {
      const { error } = await supabase.from('obras').update(payload).eq('id', editingObra.id);
      if (error) toast.error('Error al actualizar');
      else toast.success('Obra actualizada');
    } else {
      const { error } = await supabase.from('obras').insert(payload);
      if (error) toast.error('Error al crear');
      else toast.success('Obra creada');
    }
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
                    <p className="font-heading font-semibold">{o.nombre}</p>
                    <p className="text-xs text-muted-foreground">{o.cliente_nombre} · {o.direccion || 'Sin dirección'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
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
        <DialogContent>
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
              <Input placeholder="Dirección" value={direccion} onChange={e => setDireccion(e.target.value)} />
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
    </AdminLayout>
  );
}
