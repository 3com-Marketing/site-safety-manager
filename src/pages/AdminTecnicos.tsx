import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Users, Plus, Pencil, Trash2, Eye, Phone, Mail, MapPin, Hash } from 'lucide-react';
import { toast } from 'sonner';

interface Tecnico {
  id: string;
  user_id: string | null;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  codigo_tecnico: string;
  notas: string;
}

interface ProfileWithRole {
  id: string;
  user_id: string;
  nombre: string;
  email: string;
  role: string | null;
  role_id: string | null;
}

const emptyTecnico = { nombre: '', direccion: '', telefono: '', email: '', codigo_tecnico: '', notas: '', user_id: '' };

export default function AdminTecnicos() {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [profiles, setProfiles] = useState<ProfileWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewTecnico, setViewTecnico] = useState<Tecnico | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyTecnico);
  const [deleteTarget, setDeleteTarget] = useState<Tecnico | null>(null);

  const fetchData = async () => {
    const [{ data: tecs }, { data: profs }, { data: roles }] = await Promise.all([
      supabase.from('tecnicos').select('*').order('nombre'),
      supabase.from('profiles').select('*').order('nombre'),
      supabase.from('user_roles').select('*'),
    ]);

    setTecnicos((tecs || []) as Tecnico[]);

    const roleMap = new Map<string, { role: string; id: string }>();
    (roles || []).forEach((r: any) => roleMap.set(r.user_id, { role: r.role, id: r.id }));

    setProfiles(
      (profs || []).map((p: any) => {
        const r = roleMap.get(p.user_id);
        return { id: p.id, user_id: p.user_id, nombre: p.nombre || 'Sin nombre', email: p.email, role: r?.role || null, role_id: r?.id || null };
      })
    );
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditId(null); setForm(emptyTecnico); setDialogOpen(true); };
  const openEdit = (t: Tecnico) => { setEditId(t.id); setForm({ nombre: t.nombre, direccion: t.direccion, telefono: t.telefono, email: t.email, codigo_tecnico: t.codigo_tecnico, notas: t.notas, user_id: t.user_id || '' }); setDialogOpen(true); };
  const openView = (t: Tecnico) => { setViewTecnico(t); setViewDialogOpen(true); };

  const handleSave = async () => {
    const payload = {
      nombre: form.nombre,
      direccion: form.direccion,
      telefono: form.telefono,
      email: form.email,
      codigo_tecnico: form.codigo_tecnico,
      notas: form.notas,
      user_id: form.user_id || null,
    };

    if (editId) {
      const { error } = await supabase.from('tecnicos').update(payload).eq('id', editId);
      if (error) { toast.error('Error al actualizar'); return; }
      toast.success('Técnico actualizado');
    } else {
      const { error } = await supabase.from('tecnicos').insert(payload);
      if (error) { toast.error('Error al crear'); return; }
      toast.success('Técnico creado');
    }

    // Also assign tecnico role if user_id is set
    if (form.user_id) {
      await supabase.from('user_roles').delete().eq('user_id', form.user_id);
      await supabase.from('user_roles').insert({ user_id: form.user_id, role: 'tecnico' as any });
    }

    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('tecnicos').delete().eq('id', deleteTarget.id);
    if (error) toast.error('Error al eliminar');
    else toast.success('Técnico eliminado');
    setDeleteTarget(null);
    fetchData();
  };

  const linkedProfile = (userId: string | null) => profiles.find(p => p.user_id === userId);
  const unlinkedProfiles = profiles.filter(p => !tecnicos.some(t => t.user_id === p.user_id));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">Técnicos</h2>
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Nuevo técnico</Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : tecnicos.length === 0 ? (
          <p className="text-muted-foreground">No hay técnicos registrados</p>
        ) : (
          <div className="space-y-2">
            {tecnicos.map(t => {
              const profile = linkedProfile(t.user_id);
              return (
                <div key={t.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <Users className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold">{t.nombre || 'Sin nombre'}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        {t.codigo_tecnico && <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{t.codigo_tecnico}</span>}
                        {t.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{t.email}</span>}
                        {t.telefono && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{t.telefono}</span>}
                      </div>
                      {profile && <p className="text-xs text-primary mt-0.5">Vinculado: {profile.nombre}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openView(t)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(t)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar técnico' : 'Nuevo técnico'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre *</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></div>
            <div><Label>Código de técnico</Label><Input value={form.codigo_tecnico} onChange={e => setForm({ ...form, codigo_tecnico: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Teléfono</Label><Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div><Label>Dirección</Label><Input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} /></div>
            <div><Label>Notas</Label><Textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2} /></div>
            <div>
              <Label>Vincular a usuario registrado</Label>
              <Select value={form.user_id} onValueChange={val => setForm({ ...form, user_id: val === '_none' ? '' : val })}>
                <SelectTrigger><SelectValue placeholder="Sin vincular" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin vincular</SelectItem>
                  {unlinkedProfiles.map(p => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.nombre} ({p.email})</SelectItem>
                  ))}
                  {editId && form.user_id && !unlinkedProfiles.some(p => p.user_id === form.user_id) && (() => {
                    const current = profiles.find(p => p.user_id === form.user_id);
                    return current ? <SelectItem key={current.user_id} value={current.user_id}>{current.nombre} ({current.email})</SelectItem> : null;
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nombre.trim()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ficha del técnico</DialogTitle>
          </DialogHeader>
          {viewTecnico && (
            <div className="space-y-3 text-sm">
              <div><span className="font-semibold">Nombre:</span> {viewTecnico.nombre}</div>
              <div><span className="font-semibold">Código:</span> {viewTecnico.codigo_tecnico || '—'}</div>
              <div><span className="font-semibold">Email:</span> {viewTecnico.email || '—'}</div>
              <div><span className="font-semibold">Teléfono:</span> {viewTecnico.telefono || '—'}</div>
              <div><span className="font-semibold">Dirección:</span> {viewTecnico.direccion || '—'}</div>
              <div><span className="font-semibold">Notas:</span> {viewTecnico.notas || '—'}</div>
              {linkedProfile(viewTecnico.user_id) && (
                <div><span className="font-semibold">Usuario vinculado:</span> {linkedProfile(viewTecnico.user_id)?.nombre} ({linkedProfile(viewTecnico.user_id)?.email})</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar técnico?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará «{deleteTarget?.nombre}» permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
