import { Dialog, DialogContent } from '@/components/ui/dialog';

interface Props {
  url: string | null;
  onClose: () => void;
}

export default function FotoViewer({ url, onClose }: Props) {
  if (!url) return null;

  return (
    <Dialog open={!!url} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 sm:p-4 flex items-center justify-center bg-background/95">
        <img
          src={url}
          alt="Foto ampliada"
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
      </DialogContent>
    </Dialog>
  );
}
