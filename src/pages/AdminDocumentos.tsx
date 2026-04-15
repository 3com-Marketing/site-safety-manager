import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DocumentosList from '@/components/documentos/DocumentosList';

interface ObraMin { id: string; nombre: string; }

export default function AdminDocumentos() {
  const [obras, setObras] = useState<ObraMin[]>([]);
  const [obraId, setObraId] = useState<string>('');

  useEffect(() => {
    supabase.from('obras').select('id, nombre').order('nombre').then(({ data }) => {
      setObras(data || []);
      if (data && data.length > 0) setObraId(data[0].id);
    });
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">Documentos de Obra</h2>
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

        {obraId && <DocumentosList obraId={obraId} />}
      </div>
    </AdminLayout>
  );
}
