import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDocumentoPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [html, setHtml] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generar-documento-pdf', {
          body: { documento_id: id },
        });
        if (error) throw error;
        if (!data?.html) throw new Error('No se recibió HTML');
        setHtml(data.html);

        // Update status to generado if pending
        const { data: doc } = await supabase
          .from('documentos_obra')
          .select('estado')
          .eq('id', id)
          .single();
        if (doc?.estado === 'pendiente') {
          await supabase
            .from('documentos_obra')
            .update({ estado: 'generado' as any })
            .eq('id', id);
        }
      } catch (err: any) {
        console.error(err);
        toast.error('Error al generar la previsualización: ' + (err.message || ''));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handlePrint = () => {
    const edited = contentRef.current?.innerHTML;
    if (!edited) return;

    // Extract the style from original HTML
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    const styles = styleMatch ? styleMatch[1] : '';

    const printHtml = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>${styles}
@media print {
  .no-print { display: none !important; }
}
</style>
</head>
<body>${edited}</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  // Extract body content from the full HTML for editable display
  const bodyContent = html.replace(/^[\s\S]*<body>/, '').replace(/<\/body>[\s\S]*$/, '');
  const styleContent = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] || '';

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-4 no-print">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/documento/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="font-heading text-xl font-bold">Previsualización del documento</h2>
            <p className="text-sm text-muted-foreground">Puedes editar el texto directamente antes de imprimir</p>
          </div>
          <Button onClick={handlePrint} disabled={loading} className="gap-2">
            <Printer className="h-4 w-4" /> Imprimir / PDF
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-white shadow-lg overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: styleContent.replace(/@page[^}]*\{[^}]*\}/g, '').replace(/position:\s*running\([^)]*\)/g, '') }} />
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              className="p-8 min-h-[800px] focus:outline-none"
              style={{ fontFamily: "'Helvetica', 'Arial', sans-serif", fontSize: '10pt', color: '#1a1a1a', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: bodyContent }}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
