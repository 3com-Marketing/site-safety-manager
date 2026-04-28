import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PenLine, Eraser, CheckCircle, AlertCircle, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  /** URL de la firma guardada en el perfil del usuario (si la tiene) */
  firmaPerfilUrl: string | null;
  /** URL de la firma ya asociada al documento (si existe) */
  firmaActualUrl?: string | null;
  /**
   * Devuelve la firma confirmada al padre.
   * - { useStored: true } si elige reutilizar la del perfil
   * - { blob } si dibuja una nueva
   * - null si la elimina
   */
  onChange: (
    payload: { useStored: true } | { blob: Blob } | null,
    previewUrl: string | null,
  ) => void;
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

export default function FirmaSelector({ firmaPerfilUrl, firmaActualUrl, onChange }: Props) {
  const hasFirmaPerfil = !!firmaPerfilUrl;
  type Mode = 'preview' | 'choose' | 'draw';
  const [mode, setMode] = useState<Mode>(firmaActualUrl ? 'preview' : (hasFirmaPerfil ? 'choose' : 'draw'));
  const [previewUrl, setPreviewUrl] = useState<string | null>(firmaActualUrl ?? null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Init canvas when entering draw mode
  useEffect(() => {
    if (mode !== 'draw') return;
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
  }, [mode]);

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

  const useStored = () => {
    if (!firmaPerfilUrl) return;
    setPreviewUrl(firmaPerfilUrl);
    setMode('preview');
    onChange({ useStored: true }, firmaPerfilUrl);
  };

  const confirmDrawn = () => {
    if (!hasDrawn) { toast.error('Dibuja una firma antes de confirmar'); return; }
    const c = canvasRef.current!;
    const tmp = document.createElement('canvas');
    tmp.width = c.width; tmp.height = c.height;
    tmp.getContext('2d')!.drawImage(c, 0, 0);
    removeWhiteBackground(tmp);
    tmp.toBlob((blob) => {
      if (!blob) { toast.error('No se pudo generar la firma'); return; }
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setMode('preview');
      onChange({ blob }, url);
    }, 'image/png');
  };

  const removeFirma = () => {
    setPreviewUrl(null);
    setMode(hasFirmaPerfil ? 'choose' : 'draw');
    onChange(null, null);
  };

  const checkered = {
    backgroundImage:
      'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
    backgroundColor: '#ffffff',
  } as React.CSSProperties;

  return (
    <div className="space-y-3">
      {mode === 'preview' && previewUrl && (
        <div className="space-y-3">
          <div className="rounded-md border border-border p-3 flex items-center justify-center" style={checkered}>
            <img src={previewUrl} alt="Firma seleccionada" className="max-h-28 object-contain" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setMode(hasFirmaPerfil ? 'choose' : 'draw')} className="gap-2">
              <PenLine className="h-3 w-3" /> Cambiar firma
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={removeFirma} className="gap-2 text-destructive hover:text-destructive">
              <Trash2 className="h-3 w-3" /> Quitar
            </Button>
          </div>
        </div>
      )}

      {mode === 'choose' && hasFirmaPerfil && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border p-3 space-y-3">
            <p className="text-sm font-medium">Firmar con mi firma guardada</p>
            <div className="rounded-md p-3 flex items-center justify-center" style={checkered}>
              <img src={firmaPerfilUrl!} alt="Firma guardada" className="max-h-24 object-contain" />
            </div>
            <Button type="button" onClick={useStored} className="w-full gap-2" size="sm">
              <CheckCircle className="h-4 w-4" /> Usar mi firma guardada
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">o bien</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <Button type="button" variant="outline" onClick={() => setMode('draw')} className="w-full gap-2" size="sm">
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
            <Button type="button" variant="outline" size="sm" onClick={clearCanvas} className="gap-2">
              <Eraser className="h-3 w-3" /> Borrar
            </Button>
            {(hasFirmaPerfil || previewUrl) && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setMode(previewUrl ? 'preview' : 'choose')} className="gap-2">
                <ArrowLeft className="h-3 w-3" /> Volver
              </Button>
            )}
            <div className="flex-1" />
            <Button type="button" onClick={confirmDrawn} size="sm" className="gap-2">
              <CheckCircle className="h-4 w-4" /> Confirmar firma
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
