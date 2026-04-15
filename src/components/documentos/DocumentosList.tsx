import { useNavigate } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Paperclip } from 'lucide-react';
import DocumentoStatusBadge from './DocumentoStatusBadge';
import { TIPO_LABELS, type Documento } from '@/hooks/useDocumentosObra';
import { useState } from 'react';

interface Props {
  documentos: Documento[];
  basePath?: string; // /admin/documento or /documentos
  onAttach?: (doc: Documento) => void;
}

export default function DocumentosList({ documentos, basePath = '/admin/documento', onAttach }: Props) {
  const navigate = useNavigate();
  const [filtroTipo, setFiltroTipo] = useState<string>('all');

  const filtered = filtroTipo === 'all' ? documentos : documentos.filter(d => d.tipo === filtroTipo);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(TIPO_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} documento(s)</span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No hay documentos</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(doc => (
              <TableRow key={doc.id} className="cursor-pointer" onClick={() => navigate(`${basePath}/${doc.id}`)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{TIPO_LABELS[doc.tipo] || doc.tipo}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{doc.titulo || '—'}</TableCell>
                <TableCell><DocumentoStatusBadge estado={doc.estado} /></TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {doc.fecha_documento ? new Date(doc.fecha_documento).toLocaleDateString('es-ES') : '—'}
                </TableCell>
                <TableCell>
                  {onAttach && doc.estado !== 'firmado' && (
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); onAttach(doc); }} title="Adjuntar archivo">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
