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
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Plus, Pencil, Trash2, Eye, Phone, Mail, Hash, HardHat } from 'lucide-react';
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

interface ProfileMin {
  user_id: string;
  nombre: string;
  email: string;
}

interface ObraMin {
  id: string;
  nombre: string;
}

const emptyForm = { nombre: '', direccion: '', telefono: '', email: '', codigo_tecnico: '', notas: '', user_id: '' };

export default function AdminTecnicos() {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [profiles, setProfiles] = useState<ProfileMin[]>([]);
  const [obras, setObras] = useState<ObraMin[]>([]);
  const [tecnicoObras, setTecnicoObras] = useState<Record<string, string[]>>({}); // tecnico_id -> obra_id[]
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedObras, setSelectedObras] = useState<string[]>([]);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewTecnico, setViewTecnico] = useState<Tecnico | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tecnico | null>(null);

  const fetchData = async () => {
    const [{ data: tecs }, { data: profs }, { data: obrasData }, { data: links }] = await Promise.all([
      supabase.from('tecnicos').select('*').order('nombre'),
      supabase.from('profiles').select('user_id, nombre, email').order('nombre'),
      supabase.from('obras').select('id, nombre').order('nombre'),
      supabase.from('tecnicos_obras').select('tecnico_id, obra_id'),
    ]);

    setTecnicos((tecs || []) as Tecnico[]);
    setProfiles((profs || []) as ProfileMin[]);
    setObras((obrasData || []) as ObraMin[]);

    const map: Record<string, string[]> = {};
    (links || []).forEach((l: any) => {
      if (!map[l.tecnico_id]) map[l.tecnico_id] = [];
      map[l.tecnico_id].push(l.obra_id);
    });
    setTecnicoObras(map);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setSelectedObras([]); setDialogOpen(true); };
  const openEdit = (t: Tecnico) => {
    setEditId(t.id);
    setForm({ nombre: t.nombre, direccion: t.direccion, telefono: t.telefono, email: t.email, codigo_tecnico: t.codigo_tecnico, notas: t.notas, user_id: t.user_id || '' });
    setSelectedObras(tecnicoObras[t.id] || []);
    setDialogOpen(true);
  };
  const openView = (t: Tecnico) => { setViewTecnico(t); setViewDialogOpen(true); };

  const toggleObra = (obraId: string) => {
    setSelectedObras(prev => prev.includes(obraId) ? prev.filter(id => id !== obraId) : [...prev, obraId]);
  };

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

    let tecnicoId = editId;

    if (editId) {
      const { error } = await supabase.from('tecnicos').update(payload).eq('id', editId);
      if (error) { toast.error('Error al actualizar'); return; }
    } else {
      const { data, error } = await supabase.from('tecnicos').insert(payload).select('id').single();
      if (error || !data) { toast.error('Error al crear'); return; }
      tecnicoId = data.id;
    }

    // Sync obras links
    await supabase.from('tecnicos_obras').delete().eq('tecnico_id', tecnicoId!);
    if (selectedObras.length > 0) {
      await supabase.from('tecnicos_obras').insert(
        selectedObras.map(obra_id => ({ tecnico_id: tecnicoId!, obra_id }))
      );
    }

    // Assign tecnico role if linked to user
    if (form.user_id) {
      await supabase.from('user_roles').delete().eq('user_id', form.user_id);
      await supabase.from('user_roles').insert({ user_id: form.user_id, role: 'tecnico' as any });
    }

    toast.success(editId ? 'Técnico actualizado' : 'Técnico creado');
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

  const unlinkedProfiles = profiles.filter(p => !tecnicos.some(t => t.user_id === p.user_id));
  const obraNames = (tecId: string) => (tecnicoObras[tecId] || []).map(oid => obras.find(o => o.id === oid)?.nombre).filter(Boolean);

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
              const linkedObras = obraNames(t.id);
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
                      {linkedObras.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {linkedObras.map((name, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              <HardHat className="h-3 w-3" />{name}
                            </span>
                          ))}
                        </div>
                      )}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
              <Select value={form.user_id || '_none'} onValueChange={val => setForm({ ...form, user_id: val === '_none' ? '' : val })}>
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

            {/* Obras assignment */}
            <div>
              <Label className="mb-2 block">Obras asignadas</Label>
              {obras.length === 0 ? (
                <p className="text-xs text-muted-foreground">No hay obras creadas</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto rounded-lg border border-border p-3">
                  {obras.map(o => (
                    <label key={o.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedObras.includes(o.id)}
                        onCheckedChange={() => toggleObra(o.id)}
                      />
                      <span className="text-sm">{o.nombre}</span>
                    </label>
                  ))}
                </div>
              )}
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
              {(() => {
                const linked = profiles.find(p => p.user_id === viewTecnico.user_id);
                return linked ? <div><span className="font-semibold">Usuario vinculado:</span> {linked.nombre} ({linked.email})</div> : null;
              })()}
              <div>
                <span className="font-semibold">Obras asignadas:</span>
                {(obraNames(viewTecnico.id).length > 0) ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {obraNames(viewTecnico.id).map((name, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        <HardHat className="h-3 w-3" />{name}
                      </span>
                    ))}
                  </div>
                ) : <span className="text-muted-foreground ml-1">Ninguna</span>}
              </div>
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
