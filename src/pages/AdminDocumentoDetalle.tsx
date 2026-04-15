import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Paperclip } from 'lucide-react';
import DocumentoStatusBadge from '@/components/documentos/DocumentoStatusBadge';
import AdjuntarDocumentoDialog from '@/components/documentos/AdjuntarDocumentoDialog';
import FormActaNombramiento from '@/components/documentos/formularios/FormActaNombramiento';
import FormActaAprobacion from '@/components/documentos/formularios/FormActaAprobacion';
import FormActaReunion from '@/components/documentos/formularios/FormActaReunion';
import FormInforme from '@/components/documentos/formularios/FormInforme';
import { useDocumentosObra, TIPO_LABELS, type Documento } from '@/hooks/useDocumentosObra';

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
  const { updateDocumento } = useDocumentosObra();
  const [documento, setDocumento] = useState<Documento | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

  const loadDoc = async () => {
    if (!id) return;
    const { data } = await supabase.from('documentos_obra').select('*').eq('id', id).single();
    setDocumento(data);
    setLoading(false);
  };

  useEffect(() => { loadDoc(); }, [id]);

  const FormComponent = documento ? FORM_MAP[documento.tipo] : null;

  const handleSave = async (data: Record<string, any>) => {
    if (!documento) return;
    setSaving(true);
    const { obra_id, tipo, ...updates } = data;
    const ok = await updateDocumento(documento.id, updates);
    if (ok) await loadDoc();
    setSaving(false);
  };

  if (loading) return <AdminLayout><p className="text-muted-foreground">Cargando...</p></AdminLayout>;
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
          {FormComponent && <FormComponent documento={documento} onSave={handleSave} saving={saving} />}
        </div>
      </div>

      <AdjuntarDocumentoDialog open={attachOpen} onOpenChange={setAttachOpen} documento={documento} onUploaded={loadDoc} />
    </AdminLayout>
  );
}
