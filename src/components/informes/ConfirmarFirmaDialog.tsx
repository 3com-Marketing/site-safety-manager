import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PenLine, Eraser, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  firmaPerfilUrl: string | null;
  onConfirm: (payload: { useStored: true } | { blob: Blob }) => Promise<void>;
}

const CANVAS_W = 500;
const CANVAS_H = 200;
const WHITE_THRESHOLD = 235;

function removeWhiteBackground(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] > WHITE_THRESHOLD && d[i + 1] > WHITE_THRESHOLD && d[i + 2] > WHITE_THRESHOLD) {
      d[i + 3] = 0;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export default function ConfirmarFirmaDialog({ open, onClose, firmaPerfilUrl, onConfirm }: Props) {
  const hasFirmaPerfil = !!firmaPerfilUrl;
  const [mode, setMode] = useState<'choose' | 'draw'>(hasFirmaPerfil ? 'choose' : 'draw');
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setMode(hasFirmaPerfil ? 'choose' : 'draw');
      setHasDrawn(false);
      setSubmitting(false);
    }
  }, [open, hasFirmaPerfil]);

  // Init canvas when entering draw mode
  useEffect(() => {
    if (!open || mode !== 'draw') return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setHasDrawn(false);
  }, [open, mode]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * c.width,
      y: ((e.clientY - rect.top) / rect.height) * c.height,
    };
  };
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPosRef.current = getPos(e);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const pos = getPos(e);
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current!.x, lastPosRef.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
    setHasDrawn(true);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    lastPosRef.current = null;
    try { canvasRef.current?.releasePointerCapture(e.pointerId); } catch {}
  };

  const clearCanvas = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    setHasDrawn(false);
  };

  const handleStored = async () => {
    setSubmitting(true);
    try { await onConfirm({ useStored: true }); }
    finally { setSubmitting(false); }
  };

  const handleDrawn = async () => {
    if (!hasDrawn) { toast.error('Dibuja una firma antes de confirmar'); return; }
    const c = canvasRef.current!;
    const tmp = document.createElement('canvas');
    tmp.width = c.width; tmp.height = c.height;
    tmp.getContext('2d')!.drawImage(c, 0, 0);
    removeWhiteBackground(tmp);
    setSubmitting(true);
    await new Promise<void>((resolve) => {
      tmp.toBlob(async (blob) => {
        if (!blob) { toast.error('No se pudo generar la firma'); setSubmitting(false); resolve(); return; }
        try { await onConfirm({ blob }); }
        finally { setSubmitting(false); resolve(); }
      }, 'image/png');
    });
  };

  const checkered = {
    backgroundImage:
      'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
    backgroundColor: '#ffffff',
  } as React.CSSProperties;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !submitting) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5" /> Confirmar firma para cerrar el informe
          </DialogTitle>
        </DialogHeader>

        {mode === 'choose' && hasFirmaPerfil && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-3 space-y-3">
              <p className="text-sm font-medium">Firmar con mi firma guardada</p>
              <div className="rounded-md p-3 flex items-center justify-center" style={checkered}>
                <img src={firmaPerfilUrl!} alt="Firma guardada" className="max-h-28 object-contain" />
              </div>
              <Button onClick={handleStored} disabled={submitting} className="w-full gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Confirmar y cerrar informe
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">o bien</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" onClick={() => setMode('draw')} disabled={submitting} className="w-full gap-2">
              <PenLine className="h-4 w-4" /> Firmar ahora
            </Button>
          </div>
        )}

        {mode === 'draw' && (
          <div className="space-y-3">
            {!hasFirmaPerfil && (
              <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>No tienes firma guardada. Puedes añadir una en tu perfil para agilizar este paso en el futuro.</p>
              </div>
            )}
            <div className="rounded-md border border-border bg-white overflow-hidden">
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="w-full touch-none cursor-crosshair block"
                style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onPointerLeave={onPointerUp}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={clearCanvas} disabled={submitting} className="gap-2">
                <Eraser className="h-3 w-3" /> Borrar
              </Button>
              {hasFirmaPerfil && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setMode('choose')} disabled={submitting} className="gap-2">
                  <ArrowLeft className="h-3 w-3" /> Volver
                </Button>
              )}
              <div className="flex-1" />
              <Button onClick={handleDrawn} disabled={submitting} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Confirmar y cerrar informe
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
