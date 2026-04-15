import { Badge } from '@/components/ui/badge';
import { ESTADO_LABELS } from '@/hooks/useDocumentosObra';

const COLORS: Record<string, string> = {
  pendiente: 'bg-muted text-muted-foreground border-muted',
  generado: 'bg-blue-500/10 text-blue-600 border-blue-200',
  adjuntado: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  firmado: 'bg-green-500/10 text-green-600 border-green-200',
};

export default function DocumentoStatusBadge({ estado }: { estado: string }) {
  return (
    <Badge variant="outline" className={COLORS[estado] || COLORS.pendiente}>
      {ESTADO_LABELS[estado] || estado}
    </Badge>
  );
}
