import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import FotoEditor from './FotoEditor';

interface Props {
  url: string | null;
  onClose: () => void;
  editable?: boolean;
  onSave?: (newUrl: string) => Promise<void>;
  visitaId?: string;
}

export default function FotoViewer({ url, onClose, editable, onSave, visitaId }: Props) {
  const [editing, setEditing] = useState(false);

  if (!url) return null;

  if (editing && editable && onSave && visitaId) {
    return (
      <FotoEditor
        url={url}
        onClose={() => { setEditing(false); onClose(); }}
        onSave={async (newUrl) => { await onSave(newUrl); setEditing(false); }}
        visitaId={visitaId}
      />
    );
  }

  return (
    <Dialog open={!!url} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 sm:p-4 flex flex-col items-center justify-center bg-background/95">
        <img
          src={url}
          alt="Foto ampliada"
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
        {editable && onSave && visitaId && (
          <Button onClick={() => setEditing(true)} className="mt-2 gap-2">
            <Pencil className="h-4 w-4" />
            Editar foto
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
