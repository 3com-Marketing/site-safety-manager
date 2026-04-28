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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, Plus, Pencil, Trash2, Eye, Phone, Mail, Hash, HardHat, Building2, CreditCard, Smartphone, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import FirmaCapture from '@/components/tecnicos/FirmaCapture';

interface Tecnico {
  id: string;
  user_id: string | null;
  nombre: string;
  apellidos: string;
  dni: string;
  direccion: string;
  telefono: string;
  movil: string;
  email: string;
  codigo_tecnico: string;
  titulacion: string;
  num_colegiado: string;
  empresa: string;
  cif_empresa: string;
  notas: string;
  tipo: string;
  firma_url: string | null;
  firma_actualizada_at: string | null;
}

interface ProfileMin { user_id: string; nombre: string; email: string; }
interface ObraMin { id: string; nombre: string; }

const emptyForm = {
  nombre: '', apellidos: '', dni: '', direccion: '', telefono: '', movil: '',
  email: '', codigo_tecnico: '', titulacion: '', num_colegiado: '',
  empresa: '', cif_empresa: '', notas: '', user_id: '', tipo: 'tecnico',
};

export default function AdminTecnicos() {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [profiles, setProfiles] = useState<ProfileMin[]>([]);
  const [obras, setObras] = useState<ObraMin[]>([]);
  const [tecnicoObras, setTecnicoObras] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tecnico');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedObras, setSelectedObras] = useState<string[]>([]);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewTecnico, setViewTecnico] = useState<Tecnico | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tecnico | null>(null);

  const [firmaPendiente, setFirmaPendiente] = useState<Blob | null>(null);
  const [firmaUrlActual, setFirmaUrlActual] = useState<string | null>(null);
  const [firmaActualizadaAt, setFirmaActualizadaAt] = useState<string | null>(null);

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

  const filteredTecnicos = tecnicos.filter(t => (t.tipo || 'tecnico') === activeTab);

  const openCreate = (tipo: string) => {
    setEditId(null); setForm({ ...emptyForm, tipo }); setSelectedObras([]);
    setFirmaPendiente(null); setFirmaUrlActual(null); setFirmaActualizadaAt(null);
    setDialogOpen(true);
  };
  const openEdit = (t: Tecnico) => {
    setEditId(t.id);
    setForm({
      nombre: t.nombre, apellidos: t.apellidos || '', dni: t.dni || '',
      direccion: t.direccion, telefono: t.telefono, movil: t.movil || '',
      email: t.email, codigo_tecnico: t.codigo_tecnico,
      titulacion: t.titulacion || '', num_colegiado: t.num_colegiado || '',
      empresa: t.empresa || '', cif_empresa: t.cif_empresa || '',
      notas: t.notas, user_id: t.user_id || '', tipo: t.tipo || 'tecnico',
    });
    setSelectedObras(tecnicoObras[t.id] || []);
    setFirmaPendiente(null);
    setFirmaUrlActual(t.firma_url || null);
    setFirmaActualizadaAt(t.firma_actualizada_at || null);
    setDialogOpen(true);
  };
  const openView = (t: Tecnico) => { setViewTecnico(t); setViewDialogOpen(true); };

  const toggleObra = (obraId: string) => {
    setSelectedObras(prev => prev.includes(obraId) ? prev.filter(id => id !== obraId) : [...prev, obraId]);
  };

  const handleSave = async () => {
    const payload: any = {
      nombre: form.nombre, apellidos: form.apellidos, dni: form.dni,
      direccion: form.direccion, telefono: form.telefono, movil: form.movil,
      email: form.email, codigo_tecnico: form.codigo_tecnico,
      titulacion: form.titulacion, num_colegiado: form.num_colegiado,
      empresa: form.empresa, cif_empresa: form.cif_empresa,
      notas: form.notas, user_id: form.user_id || null, tipo: form.tipo,
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

    await supabase.from('tecnicos_obras').delete().eq('tecnico_id', tecnicoId!);
    if (selectedObras.length > 0) {
      await supabase.from('tecnicos_obras').insert(selectedObras.map(obra_id => ({ tecnico_id: tecnicoId!, obra_id })));
    }

    if (form.user_id) {
      await supabase.from('user_roles').delete().eq('user_id', form.user_id);
      await supabase.from('user_roles').insert({ user_id: form.user_id, role: 'tecnico' as any });
    }

    if (firmaPendiente && tecnicoId) {
      const path = `firmas/${tecnicoId}_${Date.now()}.png`;
      const { error: upErr } = await supabase.storage.from('logos').upload(path, firmaPendiente, {
        contentType: 'image/png', upsert: true,
      });
      if (upErr) {
        toast.error('Error al subir la firma');
      } else {
        const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path);
        const { error: updErr } = await supabase.from('tecnicos').update({
          firma_url: urlData.publicUrl,
          firma_actualizada_at: new Date().toISOString(),
        }).eq('id', tecnicoId);
        if (updErr) toast.error('Error al guardar la firma');
      }
    }

    toast.success(editId ? 'Actualizado' : 'Creado');
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('tecnicos').delete().eq('id', deleteTarget.id);
    if (error) toast.error('Error al eliminar');
    else toast.success('Eliminado');
    setDeleteTarget(null);
    fetchData();
  };

  const unlinkedProfiles = profiles.filter(p => !tecnicos.some(t => t.user_id === p.user_id));
  const obraNames = (tecId: string) => (tecnicoObras[tecId] || []).map(oid => obras.find(o => o.id === oid)?.nombre).filter(Boolean);

  const isCoord = form.tipo === 'coordinador';
  const labelTipo = isCoord ? 'coordinador' : 'técnico';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">Técnicos y Coordinadores</h2>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="tecnico">Técnicos</TabsTrigger>
              <TabsTrigger value="coordinador">Coordinadores</TabsTrigger>
            </TabsList>
            <Button onClick={() => openCreate(activeTab)} className="gap-2">
              <Plus className="h-4 w-4" /> Nuevo {activeTab === 'coordinador' ? 'coordinador' : 'técnico'}
            </Button>
          </div>

          {['tecnico', 'coordinador'].map(tab => (
            <TabsContent key={tab} value={tab}>
              {loading ? (
                <p className="text-muted-foreground">Cargando...</p>
              ) : filteredTecnicos.length === 0 ? (
                <p className="text-muted-foreground">No hay {tab === 'coordinador' ? 'coordinadores' : 'técnicos'} registrados</p>
              ) : (
                <div className="space-y-2">
                  {filteredTecnicos.map(t => {
                    const linkedObras = obraNames(t.id);
                    return (
                      <div key={t.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                            <Users className="h-5 w-5 text-secondary-foreground" />
                          </div>
                          <div>
                            <p className="font-heading font-semibold">{t.nombre} {t.apellidos || ''}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                              {t.dni && <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{t.dni}</span>}
                              {t.codigo_tecnico && <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{t.codigo_tecnico}</span>}
                              {t.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{t.email}</span>}
                              {t.telefono && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{t.telefono}</span>}
                              {t.empresa && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{t.empresa}</span>}
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
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? `Editar ${labelTipo}` : `Nuevo ${labelTipo}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nombre *</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></div>
              <div><Label>Apellidos</Label><Input value={form.apellidos} onChange={e => setForm({ ...form, apellidos: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>DNI / NIE</Label><Input value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} /></div>
              <div><Label>Código de técnico</Label><Input value={form.codigo_tecnico} onChange={e => setForm({ ...form, codigo_tecnico: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Titulación</Label><Input value={form.titulacion} onChange={e => setForm({ ...form, titulacion: e.target.value })} placeholder="Ej: Ingeniera Técnica Industrial" /></div>
              <div><Label>Nº Colegiado</Label><Input value={form.num_colegiado} onChange={e => setForm({ ...form, num_colegiado: e.target.value })} placeholder="Ej: 1903 (COGITILPA)" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Empresa</Label><Input value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })} /></div>
              <div><Label>CIF Empresa</Label><Input value={form.cif_empresa} onChange={e => setForm({ ...form, cif_empresa: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Teléfono</Label><Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></div>
              <div><Label>Móvil</Label><Input value={form.movil} onChange={e => setForm({ ...form, movil: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div><Label>Dirección / Domicilio</Label><Input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} /></div>
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
            <div>
              <Label className="mb-2 block">Obras asignadas</Label>
              {obras.length === 0 ? (
                <p className="text-xs text-muted-foreground">No hay obras creadas</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto rounded-lg border border-border p-3">
                  {obras.map(o => (
                    <label key={o.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={selectedObras.includes(o.id)} onCheckedChange={() => toggleObra(o.id)} />
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ficha {viewTecnico?.tipo === 'coordinador' ? 'del coordinador' : 'del técnico'}</DialogTitle>
          </DialogHeader>
          {viewTecnico && (
            <div className="space-y-3 text-sm">
              <div><span className="font-semibold">Nombre:</span> {viewTecnico.nombre} {viewTecnico.apellidos}</div>
              <div><span className="font-semibold">DNI:</span> {viewTecnico.dni || '—'}</div>
              <div><span className="font-semibold">Código:</span> {viewTecnico.codigo_tecnico || '—'}</div>
              <div><span className="font-semibold">Titulación:</span> {viewTecnico.titulacion || '—'}</div>
              <div><span className="font-semibold">Nº Colegiado:</span> {viewTecnico.num_colegiado || '—'}</div>
              <div><span className="font-semibold">Empresa:</span> {viewTecnico.empresa || '—'}</div>
              <div><span className="font-semibold">CIF Empresa:</span> {viewTecnico.cif_empresa || '—'}</div>
              <div><span className="font-semibold">Email:</span> {viewTecnico.email || '—'}</div>
              <div><span className="font-semibold">Teléfono:</span> {viewTecnico.telefono || '—'}</div>
              <div><span className="font-semibold">Móvil:</span> {viewTecnico.movil || '—'}</div>
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
            <AlertDialogTitle>¿Eliminar?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará «{deleteTarget?.nombre} {deleteTarget?.apellidos}» permanentemente.</AlertDialogDescription>
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
