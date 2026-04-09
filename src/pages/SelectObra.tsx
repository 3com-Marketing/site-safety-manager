import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Obra {
  id: string;
  nombre: string;
  direccion: string;
  cliente_nombre: string;
}

export default function SelectObra() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('obras')
      .select('id, nombre, direccion, clientes(nombre)')
      .order('nombre')
      .then(({ data }) => {
        setObras(
          (data || []).map((o: any) => ({
            id: o.id,
            nombre: o.nombre,
            direccion: o.direccion,
            cliente_nombre: o.clientes?.nombre || '',
          }))
        );
        setLoading(false);
      });
  }, []);

  const handleSelectObra = async (obraId: string) => {
    if (!user) return;
    setCreating(obraId);
    try {
      // Create visita
      const { data: visita, error: visitaError } = await supabase
        .from('visitas')
        .insert({ obra_id: obraId, usuario_id: user.id })
        .select('id')
        .single();

      if (visitaError) throw visitaError;

      // Create informe for this visita
      const { error: informeError } = await supabase
        .from('informes')
        .insert({ visita_id: visita.id });

      if (informeError) throw informeError;

      navigate(`/visita/${visita.id}`);
    } catch (err) {
      console.error(err);
      setCreating(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-heading text-lg font-bold">Seleccionar obra</h1>
      </header>

      <div className="mx-auto max-w-2xl p-4 space-y-2">
        {loading ? (
          <p className="text-muted-foreground text-sm">Cargando obras...</p>
        ) : obras.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay obras disponibles. Contacta al administrador.</p>
        ) : (
          obras.map(obra => (
            <button
              key={obra.id}
              disabled={creating !== null}
              onClick={() => handleSelectObra(obra.id)}
              className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 disabled:opacity-50"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Building2 className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-semibold truncate">{obra.nombre}</p>
                <p className="text-xs text-muted-foreground truncate">{obra.cliente_nombre} · {obra.direccion}</p>
              </div>
              {creating === obra.id && <span className="ml-auto text-xs text-muted-foreground">Creando...</span>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
