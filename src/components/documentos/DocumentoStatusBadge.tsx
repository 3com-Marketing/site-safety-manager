import { Badge } from '@/components/ui/badge';
import { ESTADO_LABELS } from '@/hooks/useDocumentosObra';
import { ESTADO_DOCUMENTO_COLORS } from '@/types/documentos';

export default function DocumentoStatusBadge({ estado }: { estado: string }) {
  return (
    <Badge variant="outline" className={ESTADO_DOCUMENTO_COLORS[estado as keyof typeof ESTADO_DOCUMENTO_COLORS] || ESTADO_DOCUMENTO_COLORS.pendiente}>
      {ESTADO_LABELS[estado] || estado}
    </Badge>
  );
}
