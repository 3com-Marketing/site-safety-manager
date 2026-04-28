import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eraser, Check, Upload, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  firmaUrl: string | null;
  actualizadaAt: string | null;
  onFirmaReady: (blob: Blob) => void;
  onClear?: () => void;
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

export default function FirmaCapture({ firmaUrl, actualizadaAt, onFirmaReady, onClear }: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>(firmaUrl ? 'view' : 'edit');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  // Init canvas (white bg)
  useEffect(() => {
    if (mode !== 'edit') return;
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

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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

  const saveDrawn = () => {
    const c = canvasRef.current;
    if (!c || !hasDrawn) {
      toast.error('Dibuja una firma antes de guardar');
      return;
    }
    // Copy to a temp canvas to apply transparency without disturbing display
    const tmp = document.createElement('canvas');
    tmp.width = c.width;
    tmp.height = c.height;
    tmp.getContext('2d')!.drawImage(c, 0, 0);
    removeWhiteBackground(tmp);
    tmp.toBlob((blob) => {
      if (!blob) { toast.error('No se pudo generar la imagen'); return; }
      onFirmaReady(blob);
      toast.success('Firma lista para guardar');
      setMode('view');
    }, 'image/png');
  };

  const handleFile = async (file: File) => {
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      toast.error('Solo se permiten imágenes PNG o JPG');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagen demasiado grande (máx 5 MB)');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const tmp = document.createElement('canvas');
      // Limit dimensions
      const maxW = 800, maxH = 400;
      const scale = Math.min(1, maxW / img.width, maxH / img.height);
      tmp.width = Math.round(img.width * scale);
      tmp.height = Math.round(img.height * scale);
      const ctx = tmp.getContext('2d')!;
      ctx.drawImage(img, 0, 0, tmp.width, tmp.height);
      removeWhiteBackground(tmp);
      tmp.toBlob((blob) => {
        if (!blob) { toast.error('No se pudo procesar la imagen'); return; }
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const pUrl = URL.createObjectURL(blob);
        setPreviewUrl(pUrl);
        setPreviewBlob(blob);
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.onerror = () => { toast.error('Imagen no válida'); URL.revokeObjectURL(url); };
    img.src = url;
  };

  const confirmUploaded = () => {
    if (!previewBlob) return;
    onFirmaReady(previewBlob);
    toast.success('Firma lista para guardar');
    setPreviewBlob(null);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
    setMode('view');
  };

  const fechaFmt = actualizadaAt
    ? new Date(actualizadaAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  // Checkered background for transparency preview
  const checkered = {
    backgroundImage:
      'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
    backgroundColor: '#ffffff',
  } as React.CSSProperties;

  if (mode === 'view' && firmaUrl) {
    return (
      <div className="rounded-lg border border-border p-3 space-y-2">
        <div className="rounded-md p-2 flex items-center justify-center" style={checkered}>
          <img src={firmaUrl} alt="Firma actual" className="max-h-32 object-contain" />
        </div>
        {fechaFmt && (
          <p className="text-xs text-muted-foreground">Última actualización: {fechaFmt}</p>
        )}
        <Button type="button" variant="outline" size="sm" onClick={() => setMode('edit')} className="gap-2">
          <RefreshCw className="h-3 w-3" /> Reemplazar firma
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-3">
      <Tabs defaultValue="dibujar">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dibujar">Dibujar</TabsTrigger>
          <TabsTrigger value="subir">Subir imagen</TabsTrigger>
        </TabsList>

        <TabsContent value="dibujar" className="space-y-2 mt-3">
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
          <div className="flex gap-2 flex-wrap">
            <Button type="button" variant="outline" size="sm" onClick={clearCanvas} className="gap-2">
              <Eraser className="h-3 w-3" /> Borrar
            </Button>
            <Button type="button" size="sm" onClick={saveDrawn} className="gap-2">
              <Check className="h-3 w-3" /> Usar esta firma
            </Button>
            {firmaUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setMode('view')}>
                Cancelar
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="subir" className="space-y-2 mt-3">
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            className="block w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-border file:bg-secondary file:text-secondary-foreground file:cursor-pointer"
          />
          {previewUrl && (
            <>
              <div className="rounded-md p-2 flex items-center justify-center" style={checkered}>
                <img src={previewUrl} alt="Previsualización" className="max-h-32 object-contain" />
              </div>
              <p className="text-xs text-muted-foreground">Se ha eliminado el fondo blanco automáticamente.</p>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={confirmUploaded} className="gap-2">
                  <Upload className="h-3 w-3" /> Usar esta imagen
                </Button>
                {firmaUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setMode('view')}>
                    Cancelar
                  </Button>
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
