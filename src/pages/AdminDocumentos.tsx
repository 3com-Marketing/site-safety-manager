import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import DocumentosList from '@/components/documentos/DocumentosList';
import NuevoDocumentoDialog from '@/components/documentos/NuevoDocumentoDialog';
import AdjuntarDocumentoDialog from '@/components/documentos/AdjuntarDocumentoDialog';
import { useDocumentosObra, type Documento } from '@/hooks/useDocumentosObra';

interface ObraMin { id: string; nombre: string; }

export default function AdminDocumentos() {
  const [obras, setObras] = useState<ObraMin[]>([]);
  const [obraId, setObraId] = useState<string>('');
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [attachDoc, setAttachDoc] = useState<Documento | null>(null);
  const { documentos, loading, fetchDocumentos } = useDocumentosObra();

  useEffect(() => {
    supabase.from('obras').select('id, nombre').order('nombre').then(({ data }) => {
      setObras(data || []);
      if (data && data.length > 0) setObraId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (obraId) fetchDocumentos(obraId);
  }, [obraId, fetchDocumentos]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">Documentos de Obra</h2>
          <Button onClick={() => setNuevoOpen(true)} disabled={!obraId} className="h-12 rounded-xl gap-2">
            <Plus className="h-5 w-5" /> Nuevo documento
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Select value={obraId} onValueChange={setObraId}>
            <SelectTrigger className="w-[320px]">
              <SelectValue placeholder="Seleccionar obra" />
            </SelectTrigger>
            <SelectContent>
              {obras.map(o => <SelectItem key={o.id} value={o.id}>{o.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : (
          <DocumentosList documentos={documentos} onAttach={doc => setAttachDoc(doc)} />
        )}
      </div>

      {obraId && (
        <NuevoDocumentoDialog open={nuevoOpen} onOpenChange={setNuevoOpen} obraId={obraId} onCreated={() => fetchDocumentos(obraId)} />
      )}
      <AdjuntarDocumentoDialog open={!!attachDoc} onOpenChange={open => !open && setAttachDoc(null)} documento={attachDoc} onUploaded={() => fetchDocumentos(obraId)} />
    </AdminLayout>
  );
}
