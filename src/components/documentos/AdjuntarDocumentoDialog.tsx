import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import { useDocumentosObra } from '@/hooks/useDocumentosObra';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentoId: string;
  obraId: string;
}

export default function AdjuntarDocumentoDialog({ open, onOpenChange, documentoId, obraId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { adjuntarArchivo } = useDocumentosObra(obraId);

  const handleUpload = async () => {
    if (!file || !documentoId) return;
    await adjuntarArchivo.mutateAsync({ id: documentoId, file });
    setFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={open => { onOpenChange(open); if (!open) setFile(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjuntar archivo firmado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sube el documento firmado (PDF o imagen). Se vinculará al documento y su estado cambiará a «Adjuntado».
          </p>
          <div className="space-y-2">
            <Label>Archivo</Label>
            <Input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </div>
          {file && (
            <p className="text-sm text-muted-foreground">📎 {file.name} ({(file.size / 1024).toFixed(0)} KB)</p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleUpload} disabled={!file || adjuntarArchivo.isPending} className="h-12 rounded-xl gap-2">
            <Upload className="h-4 w-4" />
            {adjuntarArchivo.isPending ? 'Subiendo...' : 'Adjuntar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
