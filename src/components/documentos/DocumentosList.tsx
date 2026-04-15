import { useState } from 'react';
import { FileText, Plus, Upload, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useDocumentosObra } from '@/hooks/useDocumentosObra';
import {
  TIPO_DOCUMENTO_LABELS,
  ESTADO_DOCUMENTO_COLORS,
  type TipoDocumento,
  type EstadoDocumento,
} from '@/types/documentos';
import NuevoDocumentoDialog from './NuevoDocumentoDialog';
import AdjuntarDocumentoDialog from './AdjuntarDocumentoDialog';

interface Props {
  obraId: string;
  readOnly?: boolean;
}

const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  generado: 'Generado',
  adjuntado: 'Adjuntado',
  firmado: 'Firmado',
};

export default function DocumentosList({ obraId, readOnly = false }: Props) {
  const { documentos, isLoading, actualizarEstado } = useDocumentosObra(obraId);
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [adjuntarDocId, setAdjuntarDocId] = useState<string | null>(null);

  if (isLoading) return <p className="text-muted-foreground py-8 text-center">Cargando documentos...</p>;

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold">Documentación de la obra</h3>
          <Button onClick={() => setNuevoOpen(true)} className="h-10 rounded-xl gap-2">
            <Plus className="h-4 w-4" />
            Nuevo documento
          </Button>
        </div>
      )}

      {(!documentos || documentos.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm">No hay documentos para esta obra todavía.</p>
        </div>
      )}

      <div className="space-y-3">
        {documentos?.map((doc) => {
          const colors = ESTADO_DOCUMENTO_COLORS[doc.estado as EstadoDocumento] || ESTADO_DOCUMENTO_COLORS.pendiente;
          return (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      {TIPO_DOCUMENTO_LABELS[doc.tipo as TipoDocumento] || doc.tipo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {doc.fecha_documento
                        ? new Date(doc.fecha_documento).toLocaleDateString('es-ES')
                        : 'Sin fecha'}
                      {doc.nombre_coordinador && ` · ${doc.nombre_coordinador}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={`border-0 ${colors}`}>
                    {ESTADO_LABELS[doc.estado as EstadoDocumento] || doc.estado}
                  </Badge>

                  {doc.archivo_url && (
                    <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}

                  {!readOnly && (
                    <>
                      <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => setAdjuntarDocId(doc.id)}>
                        <Upload className="h-3 w-3" />
                        Adjuntar
                      </Button>

                      {doc.estado !== 'firmado' && (
                        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => actualizarEstado.mutate({ id: doc.id, estado: 'firmado' as EstadoDocumento })}>
                          <CheckCircle className="h-3 w-3" />
                          Firmar
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <NuevoDocumentoDialog open={nuevoOpen} onOpenChange={setNuevoOpen} obraId={obraId} onCreated={() => {}} />
      <AdjuntarDocumentoDialog
        open={!!adjuntarDocId}
        onOpenChange={(open) => !open && setAdjuntarDocId(null)}
        documentoId={adjuntarDocId || ''}
        obraId={obraId}
      />
    </div>
  );
}
