import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import DocumentosList from '@/components/documentos/DocumentosList';
import AdjuntarDocumentoDialog from '@/components/documentos/AdjuntarDocumentoDialog';
import { type Documento } from '@/hooks/useDocumentosObra';

export default function TechDocumentos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [attachDoc, setAttachDoc] = useState<Documento | null>(null);

  const fetchAll = async () => {
    if (!user) return;
    // Get technician's obras
    const { data: tecData } = await supabase.from('tecnicos').select('id').eq('user_id', user.id).single();
    if (!tecData) { setLoading(false); return; }
    const { data: links } = await supabase.from('tecnicos_obras').select('obra_id').eq('tecnico_id', tecData.id);
    if (!links || links.length === 0) { setLoading(false); return; }
    const obraIds = links.map(l => l.obra_id);
    const { data } = await supabase.from('documentos_obra').select('*').in('obra_id', obraIds).order('created_at', { ascending: false });
    setDocumentos(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

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
      <div className="mx-auto max-w-4xl p-6">
        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : (
          <DocumentosList documentos={documentos} basePath="/documentos" onAttach={doc => setAttachDoc(doc)} />
        )}
      </div>
      <AdjuntarDocumentoDialog open={!!attachDoc} onOpenChange={open => !open && setAttachDoc(null)} documento={attachDoc} onUploaded={fetchAll} />
    </div>
  );
}
