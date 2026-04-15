import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Paperclip, FileDown, Loader2 } from 'lucide-react';
import DocumentoStatusBadge from '@/components/documentos/DocumentoStatusBadge';
import AdjuntarDocumentoDialog from '@/components/documentos/AdjuntarDocumentoDialog';
import FormActaNombramiento from '@/components/documentos/formularios/FormActaNombramiento';
import FormActaAprobacion from '@/components/documentos/formularios/FormActaAprobacion';
import FormActaReunion from '@/components/documentos/formularios/FormActaReunion';
import FormInforme from '@/components/documentos/formularios/FormInforme';
import { useDocumentosObra, TIPO_LABELS, type Documento, type DocumentoConRelaciones } from '@/hooks/useDocumentosObra';
import { toast } from 'sonner';

const FORM_MAP: Record<string, React.ComponentType<any>> = {
  acta_nombramiento_cae: FormActaNombramiento,
  acta_nombramiento_proyecto: FormActaNombramiento,
  acta_aprobacion_dgpo: FormActaAprobacion,
  acta_aprobacion_plan_sys: FormActaAprobacion,
  acta_reunion_cae: FormActaReunion,
  acta_reunion_inicial: FormActaReunion,
  acta_reunion_sys: FormActaReunion,
  informe_css: FormInforme,
  informe_at: FormInforme,
};

export default function AdminDocumentoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [obraId, setObraId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const { documentos, actualizarDocumento } = useDocumentosObra(obraId);
  const [attachOpen, setAttachOpen] = useState(false);

  // First load: get the obra_id from the document
  useEffect(() => {
    if (!id) return;
    supabase.from('documentos_obra').select('obra_id').eq('id', id).single().then(({ data }) => {
      if (data) setObraId(data.obra_id);
      setLoading(false);
    });
  }, [id]);

  const documento = documentos?.find(d => d.id === id) as DocumentoConRelaciones | undefined;
  const FormComponent = documento ? FORM_MAP[documento.tipo] : null;

  const handleSave = async (data: Record<string, any>) => {
    if (!documento) return;
    const { obra_id, tipo, ...updates } = data;
    await actualizarDocumento.mutateAsync({ id: documento.id, updates });
  };

  const isInforme = documento?.tipo === 'informe_css' || documento?.tipo === 'informe_at';
  const isActaAprobacion = documento?.tipo === 'acta_aprobacion_dgpo' || documento?.tipo === 'acta_aprobacion_plan_sys';
  const isActaReunion = documento?.tipo === 'acta_reunion_cae' || documento?.tipo === 'acta_reunion_inicial' || documento?.tipo === 'acta_reunion_sys';
  const isActaNombramiento = documento?.tipo === 'acta_nombramiento_cae' || documento?.tipo === 'acta_nombramiento_proyecto';
  const usesPreview = isInforme || isActaAprobacion || isActaReunion || isActaNombramiento;

  const handleGeneratePdf = async () => {
    if (!documento) return;
    // For informes, navigate to preview page
    if (usesPreview) {
      navigate(`/admin/documento/${documento.id}/preview`);
      return;
    }
    // For other types, keep direct print behavior
    setGeneratingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke('generar-documento-pdf', {
        body: { documento_id: documento.id },
      });
      if (error) throw error;
      if (!data?.html) throw new Error('No se recibió HTML');

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(data.html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }

      if (documento.estado === 'pendiente') {
        await actualizarDocumento.mutateAsync({
          id: documento.id,
          updates: { estado: 'generado' as any },
        });
      }

      toast.success('PDF generado correctamente');
    } catch (err: any) {
      console.error(err);
      toast.error('Error al generar PDF: ' + (err.message || 'Error desconocido'));
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading || (!documento && obraId)) return <AdminLayout><p className="text-muted-foreground">Cargando...</p></AdminLayout>;
  if (!documento) return <AdminLayout><p className="text-muted-foreground">Documento no encontrado</p></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/documentos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="font-heading text-xl font-bold">{TIPO_LABELS[documento.tipo] || documento.tipo}</h2>
            <p className="text-sm text-muted-foreground">{documento.titulo || 'Sin título'}</p>
          </div>
          <DocumentoStatusBadge estado={documento.estado} />
          <Button variant="outline" className="gap-2" onClick={handleGeneratePdf} disabled={generatingPdf}>
            {generatingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Generar PDF
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setAttachOpen(true)}>
            <Paperclip className="h-4 w-4" /> Adjuntar firmado
          </Button>
        </div>

        {documento.archivo_url && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm">
              📎 <a href={documento.archivo_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{documento.archivo_nombre || 'Archivo adjunto'}</a>
            </p>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-6">
          {FormComponent && <FormComponent documento={documento} obraId={obraId} onSave={handleSave} saving={actualizarDocumento.isPending} />}
        </div>
      </div>

      <AdjuntarDocumentoDialog open={attachOpen} onOpenChange={setAttachOpen} documentoId={documento?.id || ''} obraId={obraId} />
    </AdminLayout>
  );
}