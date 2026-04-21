import { useEffect, useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  MousePointer2, MoveHorizontal, Circle, Square, Type, Pencil,
  Undo2, Redo2, Save, X, Minus, ChevronRight, ChevronLeft, Loader2,
} from 'lucide-react';
import { SIGNOS_OBRA, type SignoObra } from './editorSignos';
import * as fabric from 'fabric';

type Tool = 'select' | 'arrow' | 'circle' | 'rect' | 'text' | 'free';

const COLORS = [
  { name: 'Rojo', value: '#EF4444' },
  { name: 'Amarillo', value: '#EAB308' },
  { name: 'Verde', value: '#22C55E' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Blanco', value: '#FFFFFF' },
  { name: 'Negro', value: '#000000' },
];

const STROKE_WIDTHS = [
  { label: 'Fino', value: 2 },
  { label: 'Medio', value: 4 },
  { label: 'Grueso', value: 8 },
];

interface Props {
  url: string;
  onClose: () => void;
  onSave: (newUrl: string) => Promise<void>;
  visitaId: string;
}

export default function FotoEditor({ url, onClose, onSave, visitaId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState('#EF4444');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [showSigns, setShowSigns] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const isDrawingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const tempObjRef = useRef<fabric.FabricObject | null>(null);

  // Init canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const c = new fabric.Canvas(canvasRef.current, {
      width: 900,
      height: 600,
      backgroundColor: '#1a1a1a',
    });
    fabricRef.current = c;

    // Load background image
    const imgEl = new Image();
    imgEl.crossOrigin = 'anonymous';
    imgEl.onload = () => {
      const fImg = new fabric.FabricImage(imgEl);
      const scale = Math.min(900 / imgEl.width, 600 / imgEl.height);
      fImg.scale(scale);
      fImg.set({
        left: (900 - imgEl.width * scale) / 2,
        top: (600 - imgEl.height * scale) / 2,
        selectable: false,
        evented: false,
      });
      c.backgroundImage = fImg;
      c.renderAll();
      saveHistory(c);
    };
    imgEl.src = url;

    return () => { c.dispose(); };
  }, [url]);

  const saveHistory = useCallback((c: fabric.Canvas) => {
    const json = JSON.stringify(c.toJSON());
    setHistory(prev => {
      const newH = prev.slice(0, historyIdx + 1);
      newH.push(json);
      setHistoryIdx(newH.length - 1);
      return newH;
    });
  }, [historyIdx]);

  const undo = () => {
    if (historyIdx <= 0 || !fabricRef.current) return;
    const newIdx = historyIdx - 1;
    fabricRef.current.loadFromJSON(JSON.parse(history[newIdx])).then(() => {
      fabricRef.current?.renderAll();
      setHistoryIdx(newIdx);
    });
  };

  const redo = () => {
    if (historyIdx >= history.length - 1 || !fabricRef.current) return;
    const newIdx = historyIdx + 1;
    fabricRef.current.loadFromJSON(JSON.parse(history[newIdx])).then(() => {
      fabricRef.current?.renderAll();
      setHistoryIdx(newIdx);
    });
  };

  // Tool handling
  useEffect(() => {
    const c = fabricRef.current;
    if (!c) return;

    if (tool === 'free') {
      c.isDrawingMode = true;
      c.freeDrawingBrush = new fabric.PencilBrush(c);
      c.freeDrawingBrush.color = color;
      c.freeDrawingBrush.width = strokeWidth;
      c.selection = false;
    } else {
      c.isDrawingMode = false;
      c.selection = tool === 'select';
    }

    const onMouseDown = (opt: fabric.TEvent<MouseEvent>) => {
      if (tool === 'select' || tool === 'free') return;
      const pointer = c.getScenePoint(opt.e);
      isDrawingRef.current = true;
      startPosRef.current = { x: pointer.x, y: pointer.y };

      let obj: fabric.FabricObject | null = null;
      if (tool === 'circle') {
        obj = new fabric.Ellipse({
          left: pointer.x, top: pointer.y,
          rx: 0, ry: 0,
          fill: 'transparent', stroke: color, strokeWidth,
          originX: 'center', originY: 'center',
        });
      } else if (tool === 'rect') {
        obj = new fabric.Rect({
          left: pointer.x, top: pointer.y,
          width: 0, height: 0,
          fill: 'transparent', stroke: color, strokeWidth,
        });
      } else if (tool === 'arrow') {
        obj = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: color, strokeWidth: strokeWidth + 1,
          strokeLineCap: 'round',
        });
      } else if (tool === 'text') {
        obj = new fabric.IText('Texto', {
          left: pointer.x, top: pointer.y,
          fontSize: 20, fill: color,
          fontFamily: 'sans-serif',
        });
        c.add(obj);
        c.setActiveObject(obj);
        (obj as fabric.IText).enterEditing();
        saveHistory(c);
        isDrawingRef.current = false;
        return;
      }
      if (obj) {
        tempObjRef.current = obj;
        c.add(obj);
        c.renderAll();
      }
    };

    const onMouseMove = (opt: fabric.TEvent<MouseEvent>) => {
      if (!isDrawingRef.current || !startPosRef.current || !tempObjRef.current) return;
      const pointer = c.getScenePoint(opt.e);
      const sx = startPosRef.current.x;
      const sy = startPosRef.current.y;
      const obj = tempObjRef.current;

      if (tool === 'circle' && obj instanceof fabric.Ellipse) {
        obj.set({ rx: Math.abs(pointer.x - sx) / 2, ry: Math.abs(pointer.y - sy) / 2 });
        obj.set({ left: (sx + pointer.x) / 2, top: (sy + pointer.y) / 2 });
      } else if (tool === 'rect' && obj instanceof fabric.Rect) {
        obj.set({
          left: Math.min(sx, pointer.x), top: Math.min(sy, pointer.y),
          width: Math.abs(pointer.x - sx), height: Math.abs(pointer.y - sy),
        });
      } else if (tool === 'arrow' && obj instanceof fabric.Line) {
        obj.set({ x2: pointer.x, y2: pointer.y });
      }
      c.renderAll();
    };

    const onMouseUp = () => {
      if (isDrawingRef.current) {
        // Add arrowhead for arrow tool
        if (tool === 'arrow' && tempObjRef.current instanceof fabric.Line) {
          const line = tempObjRef.current;
          const x1 = line.x1!, y1 = line.y1!, x2 = line.x2!, y2 = line.y2!;
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const headLen = 15;
          const head = new fabric.Polygon([
            { x: x2, y: y2 },
            { x: x2 - headLen * Math.cos(angle - Math.PI / 6), y: y2 - headLen * Math.sin(angle - Math.PI / 6) },
            { x: x2 - headLen * Math.cos(angle + Math.PI / 6), y: y2 - headLen * Math.sin(angle + Math.PI / 6) },
          ], { fill: color, stroke: color, strokeWidth: 1 });
          c.add(head);
        }
        saveHistory(c);
      }
      isDrawingRef.current = false;
      startPosRef.current = null;
      tempObjRef.current = null;
    };

    const onPathCreated = () => { saveHistory(c); };

    c.on('mouse:down', onMouseDown);
    c.on('mouse:move', onMouseMove);
    c.on('mouse:up', onMouseUp);
    c.on('path:created', onPathCreated);

    return () => {
      c.off('mouse:down', onMouseDown);
      c.off('mouse:move', onMouseMove);
      c.off('mouse:up', onMouseUp);
      c.off('path:created', onPathCreated);
    };
  }, [tool, color, strokeWidth, saveHistory]);

  const addSign = (signo: SignoObra) => {
    const c = fabricRef.current;
    if (!c) return;
    const svgBlob = new Blob([signo.svg], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const imgEl = new Image();
    imgEl.onload = () => {
      const fImg = new fabric.FabricImage(imgEl);
      fImg.scaleToWidth(60);
      fImg.set({ left: 400, top: 250 });
      c.add(fImg);
      c.setActiveObject(fImg);
      c.renderAll();
      saveHistory(c);
      URL.revokeObjectURL(svgUrl);
    };
    imgEl.src = svgUrl;
  };

  const handleSave = async () => {
    const c = fabricRef.current;
    if (!c) return;
    setSaving(true);
    try {
      c.discardActiveObject();
      c.renderAll();
      const dataUrl = c.toDataURL({ format: 'png', multiplier: 2 });
      const resp = await fetch(dataUrl);
      const blob = await resp.blob();
      const path = `${visitaId}/${Date.now()}_edited.png`;
      const { error: uploadError } = await supabase.storage.from('incidencia-fotos').upload(path, blob);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('incidencia-fotos').getPublicUrl(path);
      await onSave(urlData.publicUrl);
      toast.success('Imagen editada guardada');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la imagen');
    } finally {
      setSaving(false);
    }
  };

  const TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer2 className="h-4 w-4" />, label: 'Seleccionar' },
    { id: 'arrow', icon: <MoveHorizontal className="h-4 w-4" />, label: 'Flecha' },
    { id: 'circle', icon: <Circle className="h-4 w-4" />, label: 'Círculo' },
    { id: 'rect', icon: <Square className="h-4 w-4" />, label: 'Rectángulo' },
    { id: 'text', icon: <Type className="h-4 w-4" />, label: 'Texto' },
    { id: 'free', icon: <Pencil className="h-4 w-4" />, label: 'Libre' },
  ];

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] w-auto p-0 overflow-hidden bg-background">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/50">
          {/* Tool buttons */}
          {TOOLS.map(t => (
            <Button
              key={t.id}
              variant={tool === t.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTool(t.id)}
              title={t.label}
              className="h-8 w-8 p-0"
            >
              {t.icon}
            </Button>
          ))}

          <div className="w-px h-6 bg-border mx-1" />

          {/* Colors */}
          {COLORS.map(c => (
            <button
              key={c.value}
              className={`h-6 w-6 rounded-full border-2 transition-all ${color === c.value ? 'border-primary scale-110' : 'border-border'}`}
              style={{ backgroundColor: c.value }}
              onClick={() => setColor(c.value)}
              title={c.name}
            />
          ))}

          <div className="w-px h-6 bg-border mx-1" />

          {/* Stroke width */}
          {STROKE_WIDTHS.map(s => (
            <Button
              key={s.value}
              variant={strokeWidth === s.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStrokeWidth(s.value)}
              className="h-8 px-2 text-xs"
            >
              <Minus className="h-3 w-3" style={{ strokeWidth: s.value }} />
              <span className="ml-1">{s.label}</span>
            </Button>
          ))}

          <div className="w-px h-6 bg-border mx-1" />

          <Button variant="ghost" size="sm" onClick={undo} disabled={historyIdx <= 0} className="h-8 w-8 p-0">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={historyIdx >= history.length - 1} className="h-8 w-8 p-0">
            <Redo2 className="h-4 w-4" />
          </Button>

          <div className="flex-1" />

          <Button variant="ghost" size="sm" onClick={() => setShowSigns(!showSigns)} className="h-8 text-xs gap-1">
            🚧 Señales
            {showSigns ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </Button>

          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 gap-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </Button>
        </div>

        {/* Canvas + Signs panel */}
        <div className="flex overflow-hidden">
          <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-muted/30" style={{ minHeight: 400 }}>
            <canvas ref={canvasRef} />
          </div>

          {showSigns && (
            <div className="w-48 border-l border-border p-2 overflow-y-auto bg-card" style={{ maxHeight: '80vh' }}>
              <p className="text-xs font-semibold mb-2">Señales de obra</p>
              <div className="grid grid-cols-3 gap-2">
                {SIGNOS_OBRA.map(s => (
                  <button
                    key={s.id}
                    onClick={() => addSign(s)}
                    className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-muted transition-colors"
                    title={s.nombre}
                  >
                    <div
                      className="w-10 h-10"
                      dangerouslySetInnerHTML={{ __html: s.svg }}
                    />
                    <span className="text-[9px] text-muted-foreground text-center leading-tight">{s.nombre}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
