import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Upload, TrafficCone } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  useSignoCategorias, useSignosObra,
  type SignoCategoria, type SignoObraDB,
} from '@/hooks/useSignosObra';

export default function AdminSenales() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    (async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      const ok = !!data;
      setIsAdmin(ok);
      if (!ok) navigate('/');
    })();
  }, [user, authLoading, navigate]);

  if (isAdmin !== true) {
    return (
      <AdminLayout>
        <div className="p-6 text-sm text-muted-foreground">Comprobando permisos…</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <TrafficCone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">Repositorio de señales</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona las categorías y señales que aparecen en el editor de fotos.
            </p>
          </div>
        </div>

        <Tabs defaultValue="categorias">
          <TabsList>
            <TabsTrigger value="categorias">Categorías</TabsTrigger>
            <TabsTrigger value="senales">Señales</TabsTrigger>
          </TabsList>
          <TabsContent value="categorias" className="mt-4">
            <CategoriasManager />
          </TabsContent>
          <TabsContent value="senales" className="mt-4">
            <SenalesManager />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// ============================================================
// CATEGORÍAS
// ============================================================
function CategoriasManager() {
  const qc = useQueryClient();
  const { data: categorias = [], refetch } = useSignoCategorias({ soloActivas: false });
  const { data: signos = [] } = useSignosObra({ soloActivas: false });

  const [editing, setEditing] = useState<SignoCategoria | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ nombre: '', orden: 0, activa: true });

  // Eliminación con reasignación
  const [deletingCat, setDeletingCat] = useState<SignoCategoria | null>(null);
  const [reassignTo, setReassignTo] = useState<string>('');
  const [deleteMode, setDeleteMode] = useState<'reassign' | 'cascade'>('reassign');

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['signo_categorias'] });
    qc.invalidateQueries({ queryKey: ['signos_obra'] });
    refetch();
  };

  const openCreate = () => {
    setForm({ nombre: '', orden: (categorias[categorias.length - 1]?.orden ?? 0) + 1, activa: true });
    setEditing(null);
    setShowCreate(true);
  };
  const openEdit = (c: SignoCategoria) => {
    setForm({ nombre: c.nombre, orden: c.orden, activa: c.activa });
    setEditing(c);
    setShowCreate(true);
  };

  const save = async () => {
    if (!form.nombre.trim()) { toast.error('Nombre requerido'); return; }
    if (editing) {
      const { error } = await supabase.from('signo_categorias')
        .update({ nombre: form.nombre.trim(), orden: form.orden, activa: form.activa })
        .eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Categoría actualizada');
    } else {
      const { error } = await supabase.from('signo_categorias')
        .insert({ nombre: form.nombre.trim(), orden: form.orden, activa: form.activa });
      if (error) { toast.error(error.message); return; }
      toast.success('Categoría creada');
    }
    setShowCreate(false);
    refresh();
  };

  const toggleActiva = async (c: SignoCategoria) => {
    const { error } = await supabase.from('signo_categorias')
      .update({ activa: !c.activa })
      .eq('id', c.id);
    if (error) { toast.error(error.message); return; }
    refresh();
  };

  const moveOrder = async (c: SignoCategoria, dir: -1 | 1) => {
    const sorted = [...categorias].sort((a, b) => a.orden - b.orden);
    const idx = sorted.findIndex(x => x.id === c.id);
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const target = sorted[targetIdx];
    await Promise.all([
      supabase.from('signo_categorias').update({ orden: target.orden }).eq('id', c.id),
      supabase.from('signo_categorias').update({ orden: c.orden }).eq('id', target.id),
    ]);
    refresh();
  };

  const requestDelete = (c: SignoCategoria) => {
    const tieneSenales = signos.some(s => s.categoria_id === c.id);
    if (!tieneSenales) {
      setDeletingCat(c);
      setDeleteMode('reassign');
      setReassignTo('');
      return;
    }
    setDeletingCat(c);
    setDeleteMode('reassign');
    const otra = categorias.find(x => x.id !== c.id);
    setReassignTo(otra?.id ?? '');
  };

  const confirmDelete = async () => {
    if (!deletingCat) return;
    const tieneSenales = signos.some(s => s.categoria_id === deletingCat.id);
    if (tieneSenales) {
      if (deleteMode === 'reassign') {
        if (!reassignTo) { toast.error('Selecciona una categoría destino'); return; }
        const { error: e1 } = await supabase.from('signos_obra')
          .update({ categoria_id: reassignTo })
          .eq('categoria_id', deletingCat.id);
        if (e1) { toast.error(e1.message); return; }
      } else {
        const { error: e2 } = await supabase.from('signos_obra')
          .delete()
          .eq('categoria_id', deletingCat.id);
        if (e2) { toast.error(e2.message); return; }
      }
    }
    const { error } = await supabase.from('signo_categorias').delete().eq('id', deletingCat.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Categoría eliminada');
    setDeletingCat(null);
    refresh();
  };

  const sorted = [...categorias].sort((a, b) => a.orden - b.orden);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva categoría
        </Button>
      </div>

      <div className="space-y-2">
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay categorías todavía.</p>
        )}
        {sorted.map((c, idx) => {
          const count = signos.filter(s => s.categoria_id === c.id).length;
          return (
            <Card key={c.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex flex-col">
                  <Button variant="ghost" size="icon" className="h-6 w-6"
                    onClick={() => moveOrder(c, -1)} disabled={idx === 0}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6"
                    onClick={() => moveOrder(c, 1)} disabled={idx === sorted.length - 1}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.nombre}</span>
                    {!c.activa && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Inactiva</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{count} señal(es) · orden {c.orden}</p>
                </div>
                <Switch checked={c.activa} onCheckedChange={() => toggleActiva(c)} />
                <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => requestDelete(c)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Crear / Editar */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div>
              <Label>Orden</Label>
              <Input type="number" value={form.orden} onChange={e => setForm({ ...form, orden: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.activa} onCheckedChange={(v) => setForm({ ...form, activa: v })} />
              <Label>Activa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eliminar */}
      <AlertDialog open={!!deletingCat} onOpenChange={(o) => !o && setDeletingCat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar "{deletingCat?.nombre}"</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                {deletingCat && signos.some(s => s.categoria_id === deletingCat.id) ? (
                  <>
                    <p>
                      Esta categoría tiene{' '}
                      <strong>{signos.filter(s => s.categoria_id === deletingCat.id).length}</strong>{' '}
                      señal(es) asignada(s). ¿Qué deseas hacer?
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="radio" checked={deleteMode === 'reassign'}
                          onChange={() => setDeleteMode('reassign')} />
                        Reasignar a otra categoría
                      </label>
                      {deleteMode === 'reassign' && (
                        <Select value={reassignTo} onValueChange={setReassignTo}>
                          <SelectTrigger><SelectValue placeholder="Categoría destino" /></SelectTrigger>
                          <SelectContent>
                            {categorias.filter(c => c.id !== deletingCat?.id).map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <label className="flex items-center gap-2">
                        <input type="radio" checked={deleteMode === 'cascade'}
                          onChange={() => setDeleteMode('cascade')} />
                        Eliminar también las señales
                      </label>
                    </div>
                  </>
                ) : (
                  <p>Esta categoría no tiene señales. Se eliminará permanentemente.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// SEÑALES
// ============================================================
function SenalesManager() {
  const qc = useQueryClient();
  const { data: categorias = [] } = useSignoCategorias({ soloActivas: false });
  const { data: signos = [], refetch } = useSignosObra({ soloActivas: false });

  const [filtroCat, setFiltroCat] = useState<string>('todas');
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<SignoObraDB | null>(null);
  const [form, setForm] = useState({ nombre: '', categoria_id: '', activa: true, orden: 0 });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['signos_obra'] });
    refetch();
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      nombre: '',
      categoria_id: categorias[0]?.id ?? '',
      activa: true,
      orden: (signos[signos.length - 1]?.orden ?? 0) + 1,
    });
    setFile(null);
    setShowDialog(true);
  };
  const openEdit = (s: SignoObraDB) => {
    setEditing(s);
    setForm({ nombre: s.nombre, categoria_id: s.categoria_id, activa: s.activa, orden: s.orden });
    setFile(null);
    setShowDialog(true);
  };

  const save = async () => {
    if (!form.nombre.trim()) { toast.error('Nombre requerido'); return; }
    if (!form.categoria_id) { toast.error('Selecciona una categoría'); return; }
    setUploading(true);
    try {
      let imagen_url = editing?.imagen_url ?? '';
      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
        const path = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('signos-obra').upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('signos-obra').getPublicUrl(path);
        imagen_url = data.publicUrl;
      }
      if (!editing && !imagen_url) {
        toast.error('Debes subir una imagen');
        setUploading(false);
        return;
      }
      if (editing) {
        const { error } = await supabase.from('signos_obra').update({
          nombre: form.nombre.trim(),
          categoria_id: form.categoria_id,
          activa: form.activa,
          orden: form.orden,
          imagen_url,
        }).eq('id', editing.id);
        if (error) throw error;
        toast.success('Señal actualizada');
      } else {
        const { error } = await supabase.from('signos_obra').insert({
          nombre: form.nombre.trim(),
          categoria_id: form.categoria_id,
          activa: form.activa,
          orden: form.orden,
          imagen_url,
        });
        if (error) throw error;
        toast.success('Señal creada');
      }
      setShowDialog(false);
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Error guardando');
    } finally {
      setUploading(false);
    }
  };

  const toggleActiva = async (s: SignoObraDB) => {
    const { error } = await supabase.from('signos_obra').update({ activa: !s.activa }).eq('id', s.id);
    if (error) { toast.error(error.message); return; }
    refresh();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const s = signos.find(x => x.id === deleteId);
    const { error } = await supabase.from('signos_obra').delete().eq('id', deleteId);
    if (error) { toast.error(error.message); return; }
    // Borrar archivo del bucket si es de Storage (no data URI)
    if (s && !s.imagen_url.startsWith('data:')) {
      try {
        const url = new URL(s.imagen_url);
        const idx = url.pathname.indexOf('/signos-obra/');
        if (idx >= 0) {
          const path = url.pathname.slice(idx + '/signos-obra/'.length);
          await supabase.storage.from('signos-obra').remove([path]);
        }
      } catch { /* ignore */ }
    }
    toast.success('Señal eliminada');
    setDeleteId(null);
    refresh();
  };

  const senalesFiltradas = filtroCat === 'todas'
    ? signos
    : signos.filter(s => s.categoria_id === filtroCat);

  const sortedSenales = [...senalesFiltradas].sort((a, b) => a.orden - b.orden);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Select value={filtroCat} onValueChange={setFiltroCat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {categorias.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Subir señal
        </Button>
      </div>

      {sortedSenales.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay señales en esta selección.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sortedSenales.map(s => {
            const cat = categorias.find(c => c.id === s.categoria_id);
            return (
              <Card key={s.id} className={!s.activa ? 'opacity-60' : ''}>
                <CardContent className="p-3 space-y-2">
                  <div className="aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden">
                    <img src={s.imagen_url} alt={s.nombre} className="w-20 h-20 object-contain" />
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate">{s.nombre}</p>
                    <p className="text-xs text-muted-foreground truncate">{cat?.nombre ?? '—'}</p>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <Switch checked={s.activa} onCheckedChange={() => toggleActiva(s)} />
                      <span className="text-[10px] text-muted-foreground">{s.activa ? 'Activa' : 'Inactiva'}</span>
                    </div>
                    <div className="flex">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(s.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Crear / Editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar señal' : 'Subir nueva señal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Imagen {editing ? '(opcional, deja vacío para mantener)' : '(PNG, SVG o JPG)'}</Label>
              <Input
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/jpg,image/webp"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
              {editing && !file && (
                <img src={editing.imagen_url} alt="actual" className="mt-2 w-16 h-16 object-contain border rounded" />
              )}
            </div>
            <div>
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div>
              <Label>Categoría</Label>
              <Select value={form.categoria_id} onValueChange={(v) => setForm({ ...form, categoria_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {categorias.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Orden</Label>
              <Input type="number" value={form.orden}
                onChange={e => setForm({ ...form, orden: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.activa} onCheckedChange={(v) => setForm({ ...form, activa: v })} />
              <Label>Activa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={save} disabled={uploading} className="gap-2">
              {uploading && <Upload className="h-4 w-4 animate-pulse" />}
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar señal</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La señal y su imagen se eliminarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
