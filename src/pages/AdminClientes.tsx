import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface Cliente {
  id: string;
  nombre: string;
  created_at: string;
}

export default function AdminClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [nombre, setNombre] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);

  const fetchClientes = async () => {
    const { data } = await supabase.from('clientes').select('*').order('nombre');
    setClientes(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchClientes(); }, []);

  const openCreate = () => {
    setEditingCliente(null);
    setNombre('');
    setDialogOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditingCliente(c);
    setNombre(c.nombre);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    if (editingCliente) {
      const { error } = await supabase.from('clientes').update({ nombre: nombre.trim() }).eq('id', editingCliente.id);
      if (error) toast.error('Error al actualizar');
      else toast.success('Cliente actualizado');
    } else {
      const { error } = await supabase.from('clientes').insert({ nombre: nombre.trim() });
      if (error) toast.error('Error al crear');
      else toast.success('Cliente creado');
    }
    setSaving(false);
    setDialogOpen(false);
    fetchClientes();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('clientes').delete().eq('id', deleteTarget.id);
    if (error) toast.error('Error al eliminar. ¿Tiene obras asociadas?');
    else toast.success('Cliente eliminado');
    setDeleteTarget(null);
    fetchClientes();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">Clientes</h2>
          <Button onClick={openCreate} className="h-12 rounded-xl gap-2">
            <Plus className="h-5 w-5" /> Nuevo cliente
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : clientes.length === 0 ? (
          <p className="text-muted-foreground">No hay clientes registrados</p>
        ) : (
          <div className="space-y-2">
            {clientes.map(c => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <Building2 className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <p className="font-heading font-semibold">{c.nombre}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(c)}>
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
            <DialogTitle>{editingCliente ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nombre del cliente"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving || !nombre.trim()} className="h-12 rounded-xl">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
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
