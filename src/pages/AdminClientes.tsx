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
import { Plus, Pencil, Trash2, Building2, Users, UserPlus, X, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Cliente {
  id: string;
  nombre: string;
  cif: string;
  telefono: string;
  email: string;
  ciudad: string;
  tipo_cliente: string;
  notas: string;
  created_at: string;
  logo_url?: string;
}

interface Contacto {
  id: string;
  cliente_id: string;
  nombre: string;
  cargo: string;
  telefono: string;
  email: string;
}

const TIPOS_CLIENTE = ['Promotora', 'Constructora', 'Empresa', 'Otro'];

export default function AdminClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);

  // Form fields
  const [nombre, setNombre] = useState('');
  const [cif, setCif] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [tipoCliente, setTipoCliente] = useState('Promotora');
  const [notas, setNotas] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  // Contacts
  const [contactosDialogOpen, setContactosDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [contactoForm, setContactoForm] = useState({ nombre: '', cargo: '', telefono: '', email: '' });
  const [editingContacto, setEditingContacto] = useState<Contacto | null>(null);
  const [savingContacto, setSavingContacto] = useState(false);

  // Primary contacts map (cliente_id -> first contact)
  const [primaryContacts, setPrimaryContacts] = useState<Record<string, Contacto>>({});
  // All contacts map for view dialog
  const [allContactsMap, setAllContactsMap] = useState<Record<string, Contacto[]>>({});
  const [viewCliente, setViewCliente] = useState<Cliente | null>(null);

  const fetchClientes = async () => {
    const { data } = await supabase.from('clientes').select('*').order('nombre');
    setClientes(data || []);
    setLoading(false);

    // Fetch all contacts to show primary contact per client
    const { data: allContactos } = await supabase.from('contactos_cliente').select('*').order('created_at');
    if (allContactos) {
      const primary: Record<string, Contacto> = {};
      const all: Record<string, Contacto[]> = {};
      allContactos.forEach(ct => {
        if (!primary[ct.cliente_id]) primary[ct.cliente_id] = ct;
        if (!all[ct.cliente_id]) all[ct.cliente_id] = [];
        all[ct.cliente_id].push(ct);
      });
      setPrimaryContacts(primary);
      setAllContactsMap(all);
    }
  };

  useEffect(() => { fetchClientes(); }, []);

  const resetForm = () => {
    setNombre(''); setCif(''); setTelefono(''); setEmail('');
    setCiudad(''); setTipoCliente('Promotora'); setNotas('');
    setLogoFile(null); setLogoPreview('');
  };

  const openCreate = () => {
    setEditingCliente(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditingCliente(c);
    setNombre(c.nombre); setCif(c.cif); setTelefono(c.telefono);
    setEmail(c.email); setCiudad(c.ciudad);
    setTipoCliente(c.tipo_cliente || 'Promotora'); setNotas(c.notas);
    setLogoFile(null); setLogoPreview(c.logo_url || '');
    setDialogOpen(true);
  };

  const uploadLogo = async (clienteId: string): Promise<string | null> => {
    if (!logoFile) return null;
    setUploadingLogo(true);
    const ext = logoFile.name.split('.').pop();
    const path = `clientes/${clienteId}.${ext}`;
    const { error } = await supabase.storage.from('logos').upload(path, logoFile, { upsert: true });
    setUploadingLogo(false);
    if (error) { toast.error('Error al subir logo'); return null; }
    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    const payload = {
      nombre: nombre.trim(), cif: cif.trim(), telefono: telefono.trim(),
      email: email.trim(), ciudad: ciudad.trim(), tipo_cliente: tipoCliente, notas: notas.trim(),
      logo_url: undefined as string | undefined,
    };
    if (editingCliente) {
      if (logoFile) {
        const url = await uploadLogo(editingCliente.id);
        if (url) payload.logo_url = url;
      }
      const { logo_url, ...updatePayload } = payload;
      const finalPayload = logo_url ? { ...updatePayload, logo_url } : updatePayload;
      const { error } = await supabase.from('clientes').update(finalPayload).eq('id', editingCliente.id);
      if (error) toast.error('Error al actualizar');
      else toast.success('Cliente actualizado');
    } else {
      const { logo_url: _lu, ...insertPayload } = payload;
      const { data: inserted, error } = await supabase.from('clientes').insert({ ...insertPayload, nombre: insertPayload.nombre }).select('id').single();
      if (error) { toast.error('Error al crear'); }
      else {
        if (logoFile && inserted) {
          const url = await uploadLogo(inserted.id);
          if (url) await supabase.from('clientes').update({ logo_url: url }).eq('id', inserted.id);
        }
        toast.success('Cliente creado');
      }
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

  // Contacts management
  const openContactos = async (c: Cliente) => {
    setSelectedCliente(c);
    setContactosDialogOpen(true);
    setEditingContacto(null);
    setContactoForm({ nombre: '', cargo: '', telefono: '', email: '' });
    const { data } = await supabase.from('contactos_cliente').select('*').eq('cliente_id', c.id).order('nombre');
    setContactos(data || []);
  };

  const handleSaveContacto = async () => {
    if (!selectedCliente || !contactoForm.nombre.trim()) return;
    setSavingContacto(true);
    if (editingContacto) {
      const { error } = await supabase.from('contactos_cliente')
        .update({ nombre: contactoForm.nombre.trim(), cargo: contactoForm.cargo.trim(), telefono: contactoForm.telefono.trim(), email: contactoForm.email.trim() })
        .eq('id', editingContacto.id);
      if (error) toast.error('Error al actualizar contacto');
      else toast.success('Contacto actualizado');
    } else {
      const { error } = await supabase.from('contactos_cliente')
        .insert({ cliente_id: selectedCliente.id, nombre: contactoForm.nombre.trim(), cargo: contactoForm.cargo.trim(), telefono: contactoForm.telefono.trim(), email: contactoForm.email.trim() });
      if (error) toast.error('Error al crear contacto');
      else toast.success('Contacto creado');
    }
    setSavingContacto(false);
    setEditingContacto(null);
    setContactoForm({ nombre: '', cargo: '', telefono: '', email: '' });
    const { data } = await supabase.from('contactos_cliente').select('*').eq('cliente_id', selectedCliente.id).order('nombre');
    setContactos(data || []);
  };

  const startEditContacto = (ct: Contacto) => {
    setEditingContacto(ct);
    setContactoForm({ nombre: ct.nombre, cargo: ct.cargo, telefono: ct.telefono, email: ct.email });
  };

  const handleDeleteContacto = async (ct: Contacto) => {
    if (!selectedCliente) return;
    const { error } = await supabase.from('contactos_cliente').delete().eq('id', ct.id);
    if (error) toast.error('Error al eliminar contacto');
    else toast.success('Contacto eliminado');
    const { data } = await supabase.from('contactos_cliente').select('*').eq('cliente_id', selectedCliente.id).order('nombre');
    setContactos(data || []);
  };

  const tipoLabel = (tipo: string) => {
    const colors: Record<string, string> = {
      Promotora: 'bg-primary/10 text-primary',
      Constructora: 'bg-blue-500/10 text-blue-600',
      Empresa: 'bg-green-500/10 text-green-600',
      Otro: 'bg-muted text-muted-foreground',
    };
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[tipo] || colors.Otro}`}>{tipo}</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">Clientes / Promotoras</h2>
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.nombre} className="h-full w-full object-contain p-1" />
                    ) : (
                      <Building2 className="h-5 w-5 text-secondary-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-semibold">{c.nombre}</p>
                      {tipoLabel(c.tipo_cliente)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {[c.cif, c.ciudad, c.telefono].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
                    </p>
                    {primaryContacts[c.id] && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium text-foreground/70">Contacto:</span>{' '}
                        {[primaryContacts[c.id].nombre, primaryContacts[c.id].cargo, primaryContacts[c.id].telefono, primaryContacts[c.id].email].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openContactos(c)} title="Contactos">
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setViewCliente(c)} title="Ver ficha">
                    <Eye className="h-4 w-4" />
                  </Button>
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

      {/* View Client Dialog */}
      <Dialog open={!!viewCliente} onOpenChange={open => !open && setViewCliente(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {viewCliente?.logo_url ? (
                <img src={viewCliente.logo_url} alt={viewCliente.nombre} className="h-8 w-8 rounded object-contain" />
              ) : (
                <Building2 className="h-5 w-5" />
              )}
              {viewCliente?.nombre}
              {viewCliente && tipoLabel(viewCliente.tipo_cliente)}
            </DialogTitle>
          </DialogHeader>
          {viewCliente && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">CIF</p>
                  <p className="font-medium">{viewCliente.cif || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Ciudad</p>
                  <p className="font-medium">{viewCliente.ciudad || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Teléfono</p>
                  <p className="font-medium">{viewCliente.telefono || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="font-medium">{viewCliente.email || '—'}</p>
                </div>
              </div>
              {viewCliente.notas && (
                <div>
                  <p className="text-muted-foreground text-xs">Notas</p>
                  <p className="text-sm">{viewCliente.notas}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Contactos
                </p>
                {(allContactsMap[viewCliente.id] || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin contactos</p>
                ) : (
                  <div className="space-y-2">
                    {(allContactsMap[viewCliente.id] || []).map(ct => (
                      <div key={ct.id} className="rounded-lg border border-border bg-muted/30 p-3">
                        <p className="text-sm font-semibold">{ct.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {[ct.cargo, ct.telefono, ct.email].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Client Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCliente ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Nombre de la empresa *</Label>
              <Input placeholder="Nombre de la empresa" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Logotipo de la empresa</Label>
              {logoPreview && (
                <div className="flex items-center gap-2 mb-2">
                  <img src={logoPreview} alt="Logo" className="h-12 object-contain rounded border border-border p-1" />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setLogoFile(null); setLogoPreview(''); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setLogoFile(file);
                    setLogoPreview(URL.createObjectURL(file));
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CIF</Label>
                <Input placeholder="B12345678" value={cif} onChange={e => setCif(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de cliente</Label>
                <Select value={tipoCliente} onValueChange={setTipoCliente}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_CLIENTE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input placeholder="600 000 000" value={telefono} onChange={e => setTelefono(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input placeholder="info@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input placeholder="Ciudad" value={ciudad} onChange={e => setCiudad(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea placeholder="Notas adicionales..." value={notas} onChange={e => setNotas(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving || !nombre.trim()} className="h-12 rounded-xl">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contacts Dialog */}
      <Dialog open={contactosDialogOpen} onOpenChange={setContactosDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contactos — {selectedCliente?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Contact form */}
            <div className="rounded-xl border border-border p-4 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {editingContacto ? 'Editar contacto' : 'Nuevo contacto'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Nombre" value={contactoForm.nombre} onChange={e => setContactoForm(f => ({ ...f, nombre: e.target.value }))} />
                <Input placeholder="Cargo" value={contactoForm.cargo} onChange={e => setContactoForm(f => ({ ...f, cargo: e.target.value }))} />
                <Input placeholder="Teléfono" value={contactoForm.telefono} onChange={e => setContactoForm(f => ({ ...f, telefono: e.target.value }))} />
                <Input placeholder="Email" value={contactoForm.email} onChange={e => setContactoForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveContacto} disabled={savingContacto || !contactoForm.nombre.trim()} className="rounded-lg">
                  {savingContacto ? 'Guardando...' : editingContacto ? 'Actualizar' : 'Añadir'}
                </Button>
                {editingContacto && (
                  <Button size="sm" variant="ghost" onClick={() => { setEditingContacto(null); setContactoForm({ nombre: '', cargo: '', telefono: '', email: '' }); }}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>

            {/* Contact list */}
            {contactos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin contactos</p>
            ) : (
              <div className="space-y-2">
                {contactos.map(ct => (
                  <div key={ct.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                    <div>
                      <p className="text-sm font-semibold">{ct.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {[ct.cargo, ct.telefono, ct.email].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditContacto(ct)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteContacto(ct)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará «{deleteTarget?.nombre}» y todos sus contactos. Esta acción no se puede deshacer.
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
