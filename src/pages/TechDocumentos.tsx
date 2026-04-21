import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import DocumentosList from '@/components/documentos/DocumentosList';

interface ObraMin { id: string; nombre: string; }

export default function TechDocumentos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [obras, setObras] = useState<ObraMin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: tecData } = await supabase.from('tecnicos').select('id').eq('user_id', user.id).single();
      if (!tecData) { setLoading(false); return; }
      const { data: links } = await supabase.from('tecnicos_obras').select('obra_id').eq('tecnico_id', tecData.id);
      if (!links || links.length === 0) { setLoading(false); return; }
      const obraIds = links.map(l => l.obra_id);
      const { data } = await supabase.from('obras').select('id, nombre').in('id', obraIds).order('nombre');
      setObras(data || []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-heading text-lg font-bold">Documentos de obra</h1>
        </div>
      </header>
      <div className="mx-auto max-w-4xl p-4 sm:p-6 space-y-6 sm:space-y-8">
        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : obras.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No tienes obras asignadas.</p>
        ) : (
          obras.map(obra => (
            <div key={obra.id} className="space-y-2">
              <h2 className="font-heading text-base font-semibold text-foreground">{obra.nombre}</h2>
              <DocumentosList obraId={obra.id} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
