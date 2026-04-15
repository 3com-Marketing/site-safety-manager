import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import { useDocumentosObra, type Documento } from '@/hooks/useDocumentosObra';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documento: Documento | null;
  onUploaded: () => void;
}

export default function AdjuntarDocumentoDialog({ open, onOpenChange, documento, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadArchivo } = useDocumentosObra();

  const handleUpload = async () => {
    if (!file || !documento) return;
    setUploading(true);
    const result = await uploadArchivo(documento.id, file);
    setUploading(false);
    if (result) {
      setFile(null);
      onOpenChange(false);
      onUploaded();
    }
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
          <Button onClick={handleUpload} disabled={!file || uploading} className="h-12 rounded-xl gap-2">
            <Upload className="h-4 w-4" />
            {uploading ? 'Subiendo...' : 'Adjuntar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
