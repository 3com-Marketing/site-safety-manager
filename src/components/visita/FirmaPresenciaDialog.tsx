import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PenLine, Eraser, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const TEXTO_LEGAL_PRESENCIA = `Las firmas que figuran a continuación acreditan únicamente la presencia del técnico en obra el día y la hora indicados, y la entrega del presente documento al responsable de la empresa para su conocimiento. No implican aceptación, conformidad ni reconocimiento del contenido del informe por parte del firmante. Las observaciones, incidencias o amonestaciones recogidas en el informe son responsabilidad exclusiva del técnico que lo emite, conforme a sus competencias profesionales y a la normativa de prevención de riesgos laborales aplicable. La firma del responsable de la empresa indica que ha recibido copia o acceso al documento y que ha sido informado de los extremos contenidos en él, sin que ello suponga renuncia a presentar alegaciones o aclaraciones por los cauces que estime oportunos.`;

interface FirmasPayload {
  responsableNombre: string;
  responsableCargo: string;
  responsableBlob: Blob;
  /** Si el técnico reutiliza la firma de su perfil */
  tecnicoUseStored?: boolean;
  /** Si el técnico dibuja una nueva */
  tecnicoBlob?: Blob;
  firmasAt: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tecnicoNombre: string;
  firmaPerfilUrl: string | null;
  onConfirm: (payload: FirmasPayload) => Promise<void>;
}

const CANVAS_W = 600;
const CANVAS_H = 220;
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

function TextoLegalPresencia() {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Antes de firmar, lea este texto:</p>
      <div className="rounded-md border border-border bg-muted/30 p-4 max-w-prose">
        <p className="text-[14px] leading-relaxed text-foreground">{TEXTO_LEGAL_PRESENCIA}</p>
      </div>
    </div>
  );
}

interface SignaturePadProps {
  onReady: (blob: Blob | null) => void;
}

function SignaturePad({ onReady }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

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
    if (!hasDrawn) setHasDrawn(true);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    lastPosRef.current = null;
    try { canvasRef.current?.releasePointerCapture(e.pointerId); } catch {}
    // Generate blob on stroke end
    if (hasDrawn) generateBlob();
  };

  const generateBlob = () => {
    const c = canvasRef.current!;
    const tmp = document.createElement('canvas');
    tmp.width = c.width; tmp.height = c.height;
    tmp.getContext('2d')!.drawImage(c, 0, 0);
    removeWhiteBackground(tmp);
    tmp.toBlob((blob) => onReady(blob), 'image/png');
  };

  const clearCanvas = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    setHasDrawn(false);
    onReady(null);
  };

  return (
    <div className="space-y-2">
      <div className="rounded-md border-2 border-dashed border-border bg-white overflow-hidden">
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
      <Button type="button" variant="outline" size="sm" onClick={clearCanvas} className="gap-2">
        <Eraser className="h-3 w-3" /> Borrar
      </Button>
    </div>
  );
}

const checkered: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
  backgroundColor: '#ffffff',
};

export default function FirmaPresenciaDialog({
  open,
  onOpenChange,
  tecnicoNombre,
  firmaPerfilUrl,
  onConfirm,
}: Props) {
  type Step = 'responsable' | 'tecnico' | 'resumen';
  const [step, setStep] = useState<Step>('responsable');

  // Responsable
  const [resNombre, setResNombre] = useState('');
  const [resCargo, setResCargo] = useState('');
  const [resBlob, setResBlob] = useState<Blob | null>(null);
  const [resPreview, setResPreview] = useState<string | null>(null);

  // Técnico
  type TecMode = 'choose' | 'stored' | 'draw';
  const initialTecMode: TecMode = firmaPerfilUrl ? 'choose' : 'draw';
  const [tecMode, setTecMode] = useState<TecMode>(initialTecMode);
  const [tecBlob, setTecBlob] = useState<Blob | null>(null);
  const [tecPreview, setTecPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [firmasAt, setFirmasAt] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('responsable');
      setResNombre(''); setResCargo(''); setResBlob(null); setResPreview(null);
      setTecMode(firmaPerfilUrl ? 'choose' : 'draw');
      setTecBlob(null); setTecPreview(null);
      setFirmasAt(null);
      setSubmitting(false);
    }
  }, [open, firmaPerfilUrl]);

  const goResponsable = () => setStep('responsable');
  const goTecnico = () => {
    if (!resNombre.trim() || !resCargo.trim()) { toast.error('Indica nombre y cargo del responsable'); return; }
    if (!resBlob) { toast.error('Dibuja la firma del responsable'); return; }
    setResPreview((p) => p || URL.createObjectURL(resBlob));
    setStep('tecnico');
  };
  const goResumen = () => {
    if (tecMode === 'draw' && !tecBlob) { toast.error('Dibuja tu firma como técnico'); return; }
    if (tecMode === 'stored' && !firmaPerfilUrl) { toast.error('No tienes firma guardada'); return; }
    if (tecMode === 'draw' && tecBlob) {
      setTecPreview((p) => p || URL.createObjectURL(tecBlob));
    } else if (tecMode === 'stored') {
      setTecPreview(firmaPerfilUrl);
    }
    setFirmasAt(new Date().toISOString());
    setStep('resumen');
  };

  const handleConfirm = async () => {
    if (!resBlob || !firmasAt) return;
    setSubmitting(true);
    try {
      await onConfirm({
        responsableNombre: resNombre.trim(),
        responsableCargo: resCargo.trim(),
        responsableBlob: resBlob,
        tecnicoUseStored: tecMode === 'stored' || undefined,
        tecnicoBlob: tecMode === 'draw' ? tecBlob! : undefined,
        firmasAt,
      });
    } catch (err) {
      console.error(err);
      toast.error('No se pudo cerrar la visita con las firmas');
      setSubmitting(false);
    }
  };

  const fmtFechaHora = (iso: string) =>
    new Date(iso).toLocaleString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) onOpenChange(o); }}>
      <DialogContent
        className="max-w-3xl max-h-[92vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => { if (submitting) e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            Firmas de presencia · {step === 'responsable' ? 'Responsable de la empresa' : step === 'tecnico' ? 'Técnico' : 'Resumen'}
          </DialogTitle>
          <DialogDescription>
            Paso {step === 'responsable' ? 1 : step === 'tecnico' ? 2 : 3} de 3 · No se podrá cerrar la visita sin completar ambas firmas.
          </DialogDescription>
        </DialogHeader>

        {step === 'responsable' && (
          <div className="space-y-5">
            <TextoLegalPresencia />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="res-nombre">Nombre y apellidos *</Label>
                <Input id="res-nombre" value={resNombre} onChange={(e) => setResNombre(e.target.value)} autoComplete="off" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="res-cargo">Cargo *</Label>
                <Input id="res-cargo" value={resCargo} onChange={(e) => setResCargo(e.target.value)} autoComplete="off" placeholder="Ej. Jefe de obra" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Firma del responsable *</Label>
              <SignaturePad onReady={setResBlob} />
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
              <Button onClick={goTecnico} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                <PenLine className="h-4 w-4" /> Firmar y continuar
              </Button>
            </div>
          </div>
        )}

        {step === 'tecnico' && (
          <div className="space-y-5">
            <TextoLegalPresencia />

            <div className="rounded-md border border-border p-3 bg-muted/20">
              <p className="text-xs text-muted-foreground">Técnico</p>
              <p className="font-semibold">{tecnicoNombre || '—'}</p>
            </div>

            {!firmaPerfilUrl && (
              <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>No tienes firma guardada. Puedes guardar una en tu perfil para agilizar este paso en futuras visitas.</p>
              </div>
            )}

            {firmaPerfilUrl && tecMode === 'choose' && (
              <div className="space-y-3">
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <p className="text-sm font-medium">Usar mi firma guardada</p>
                  <div className="rounded-md p-3 flex items-center justify-center" style={checkered}>
                    <img src={firmaPerfilUrl} alt="Firma guardada" className="max-h-28 object-contain" />
                  </div>
                  <Button onClick={() => setTecMode('stored')} className="w-full gap-2">
                    <CheckCircle className="h-4 w-4" /> Usar mi firma guardada
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">o bien</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <Button variant="outline" onClick={() => setTecMode('draw')} className="w-full gap-2">
                  <PenLine className="h-4 w-4" /> Firmar ahora
                </Button>
              </div>
            )}

            {tecMode === 'stored' && firmaPerfilUrl && (
              <div className="space-y-3">
                <div className="rounded-md border border-border p-3 flex items-center justify-center" style={checkered}>
                  <img src={firmaPerfilUrl} alt="Firma seleccionada" className="max-h-32 object-contain" />
                </div>
                <Button variant="ghost" size="sm" onClick={() => setTecMode('choose')} className="gap-2">
                  <ArrowLeft className="h-3 w-3" /> Cambiar
                </Button>
              </div>
            )}

            {tecMode === 'draw' && (
              <div className="space-y-2">
                <Label>Firma del técnico *</Label>
                <SignaturePad onReady={setTecBlob} />
                {firmaPerfilUrl && (
                  <Button variant="ghost" size="sm" onClick={() => { setTecBlob(null); setTecMode('choose'); }} className="gap-2">
                    <ArrowLeft className="h-3 w-3" /> Volver a opciones
                  </Button>
                )}
              </div>
            )}

            <div className="flex justify-between gap-2 pt-2">
              <Button variant="outline" onClick={goResponsable} disabled={submitting} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Volver
              </Button>
              <Button onClick={goResumen} className="gap-2" disabled={tecMode === 'choose'}>
                Siguiente: Resumen
              </Button>
            </div>
          </div>
        )}

        {step === 'resumen' && firmasAt && (
          <div className="space-y-5">
            <TextoLegalPresencia />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border p-3 space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Responsable de la empresa</p>
                <p className="font-semibold">{resNombre}</p>
                <p className="text-sm text-muted-foreground">{resCargo}</p>
                <div className="rounded p-2 flex items-center justify-center" style={checkered}>
                  {resPreview && <img src={resPreview} alt="Firma responsable" className="max-h-24 object-contain" />}
                </div>
                <p className="text-xs text-muted-foreground">{fmtFechaHora(firmasAt)}</p>
              </div>

              <div className="rounded-md border border-border p-3 space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Técnico</p>
                <p className="font-semibold">{tecnicoNombre}</p>
                <p className="text-sm text-muted-foreground">&nbsp;</p>
                <div className="rounded p-2 flex items-center justify-center" style={checkered}>
                  {tecPreview && <img src={tecPreview} alt="Firma técnico" className="max-h-24 object-contain" />}
                </div>
                <p className="text-xs text-muted-foreground">{fmtFechaHora(firmasAt)}</p>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep('tecnico')} disabled={submitting} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Volver
              </Button>
              <Button onClick={handleConfirm} disabled={submitting} className="gap-2 bg-success hover:bg-success/90 text-success-foreground">
                <CheckCircle className="h-4 w-4" />
                {submitting ? 'Cerrando visita...' : 'Cerrar visita'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
