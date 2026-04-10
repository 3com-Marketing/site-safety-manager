import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Users, ShieldCheck, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileWithRole {
  id: string;
  user_id: string;
  nombre: string;
  email: string;
  role: string | null;
  role_id: string | null;
}

export default function AdminTecnicos() {
  const [profiles, setProfiles] = useState<ProfileWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<ProfileWithRole | null>(null);

  const fetchProfiles = async () => {
    const { data: profs } = await supabase.from('profiles').select('*').order('nombre');
    const { data: roles } = await supabase.from('user_roles').select('*');

    const roleMap = new Map<string, { role: string; id: string }>();
    (roles || []).forEach((r: any) => roleMap.set(r.user_id, { role: r.role, id: r.id }));

    setProfiles(
      (profs || []).map((p: any) => {
        const r = roleMap.get(p.user_id);
        return {
          id: p.id,
          user_id: p.user_id,
          nombre: p.nombre || 'Sin nombre',
          email: p.email,
          role: r?.role || null,
          role_id: r?.id || null,
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const assignRole = async (userId: string, role: 'admin' | 'tecnico') => {
    // Remove existing role first
    await supabase.from('user_roles').delete().eq('user_id', userId);
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
    if (error) toast.error('Error al asignar rol');
    else toast.success(`Rol "${role}" asignado`);
    fetchProfiles();
  };

  const removeRole = async () => {
    if (!removeTarget?.role_id) return;
    const { error } = await supabase.from('user_roles').delete().eq('id', removeTarget.role_id);
    if (error) toast.error('Error al quitar rol');
    else toast.success('Rol eliminado');
    setRemoveTarget(null);
    fetchProfiles();
  };

  const roleLabel = (role: string | null) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'tecnico': return 'Técnico';
      default: return 'Sin rol';
    }
  };

  const roleColor = (role: string | null) => {
    switch (role) {
      case 'admin': return 'bg-primary/10 text-primary';
      case 'tecnico': return 'bg-success/10 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">Técnicos y usuarios</h2>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : profiles.length === 0 ? (
          <p className="text-muted-foreground">No hay usuarios registrados</p>
        ) : (
          <div className="space-y-2">
            {profiles.map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <Users className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-heading font-semibold">{p.nombre}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${roleColor(p.role)}`}>
                    {roleLabel(p.role)}
                  </span>
                  <Select
                    value={p.role || ''}
                    onValueChange={(val) => assignRole(p.user_id, val as 'admin' | 'tecnico')}
                  >
                    <SelectTrigger className="w-[130px] h-9">
                      <SelectValue placeholder="Asignar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {p.role && (
                    <Button variant="ghost" size="icon" onClick={() => setRemoveTarget(p)}>
                      <UserMinus className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!removeTarget} onOpenChange={open => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar rol?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el rol «{removeTarget?.role}» de {removeTarget?.nombre}. El usuario no podrá acceder hasta que se le asigne un nuevo rol.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={removeRole} className="bg-destructive text-destructive-foreground">
              Quitar rol
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
