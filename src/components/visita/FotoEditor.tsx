import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  MousePointer2, MoveHorizontal, Circle, Square, Type, Pencil,
  Undo2, Redo2, Save, X, Minus, ChevronRight, ChevronLeft, Loader2, Trash2,
  LayoutGrid, Search,
} from 'lucide-react';
import * as fabric from 'fabric';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsTabletOrBelow } from '@/hooks/use-tablet';
import { useSignoCategorias, useSignosObra, type SignoObraDB } from '@/hooks/useSignosObra';
import { Input } from '@/components/ui/input';

const ALL_ID = '__all__';

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

const TOOLBAR_HEIGHT = 52;

export default function FotoEditor({ url, onClose, onSave, visitaId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState('#EF4444');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [showSigns, setShowSigns] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const isTabletOrBelow = useIsTabletOrBelow();
  const [selectedCatId, setSelectedCatId] = useState<string | null>(ALL_ID);
  const [query, setQuery] = useState('');
  const { data: categorias = [] } = useSignoCategorias({ soloActivas: true });
  const { data: signos = [] } = useSignosObra({ soloActivas: true });

  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const signosFiltrados = (() => {
    const q = normalize(query.trim());
    let base = signos;
    if (selectedCatId && selectedCatId !== ALL_ID) {
      base = base.filter(s => s.categoria_id === selectedCatId);
    }
    if (q) base = base.filter(s => normalize(s.nombre).includes(q));
    return base;
  })();

  // For "Todas": group filtered signs by category preserving categoria order
  const signosAgrupados = (() => {
    if (selectedCatId !== ALL_ID) return [];
    return categorias
      .map(cat => ({
        cat,
        items: signosFiltrados.filter(s => s.categoria_id === cat.id),
      }))
      .filter(g => g.items.length > 0);
  })();

  // History via refs to avoid stale closures
  const historyRef = useRef<string[]>([]);
  const historyIdxRef = useRef(-1);
  const [, forceRender] = useState(0);

  const isDrawingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const tempObjRef = useRef<fabric.FabricObject | null>(null);

  const getCanvasSize = useCallback(() => {
    // On tablet/mobile, the signs panel is a bottom sheet overlay — don't shrink the canvas
    const signsW = !isTabletOrBelow && showSigns ? 360 : 0;
    const w = window.innerWidth - signsW - 16;
    const h = window.innerHeight - TOOLBAR_HEIGHT - 16;
    return { w: Math.max(w, 400), h: Math.max(h, 300) };
  }, [showSigns, isTabletOrBelow]);

  const saveHistory = useCallback((c: fabric.Canvas) => {
    // Only serialize objects, not backgroundImage (avoids revoked blob URL issue)
    const objectsJson = c.getObjects().map(o => o.toObject());
    const json = JSON.stringify(objectsJson);
    const arr = historyRef.current.slice(0, historyIdxRef.current + 1);
    arr.push(json);
    historyRef.current = arr;
    historyIdxRef.current = arr.length - 1;
    forceRender(n => n + 1);
  }, []);

  // Init canvas & load image
  useEffect(() => {
    if (!canvasRef.current) return;
    const { w, h } = getCanvasSize();
    const c = new fabric.Canvas(canvasRef.current, {
      width: w,
      height: h,
      backgroundColor: '#1a1a1a',
    });
    fabricRef.current = c;

    // Load image via fetch to avoid CORS
    (async () => {
      try {
        const resp = await fetch(url);
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);

        const imgEl = new Image();
        imgEl.onload = () => {
          const fImg = new fabric.FabricImage(imgEl);
          const scale = Math.min(w / imgEl.width, h / imgEl.height);
          fImg.scale(scale);
          fImg.set({
            left: (w - imgEl.width * scale) / 2,
            top: (h - imgEl.height * scale) / 2,
            selectable: false,
            evented: false,
          });
          c.backgroundImage = fImg;
          c.renderAll();
          saveHistory(c);
          setLoading(false);
          URL.revokeObjectURL(blobUrl);
        };
        imgEl.onerror = () => {
          console.error('Failed to load image from blob');
          setLoading(false);
          URL.revokeObjectURL(blobUrl);
        };
        imgEl.src = blobUrl;
      } catch (err) {
        console.error('Failed to fetch image:', err);
        setLoading(false);
      }
    })();

    return () => { c.dispose(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Resize canvas when signs panel toggles
  useEffect(() => {
    const c = fabricRef.current;
    if (!c) return;
    const { w, h } = getCanvasSize();
    c.setDimensions({ width: w, height: h });
    c.renderAll();
  }, [showSigns, getCanvasSize]);

  const restoreHistory = useCallback((idx: number) => {
    const c = fabricRef.current;
    if (!c) return;
    const objectsJson = JSON.parse(historyRef.current[idx]);
    // Remove all objects but keep backgroundImage
    c.remove(...c.getObjects());
    if (objectsJson.length > 0) {
      fabric.util.enlivenObjects(objectsJson).then((objs: fabric.FabricObject[]) => {
        objs.forEach(o => c.add(o));
        c.renderAll();
      });
    } else {
      c.renderAll();
    }
    forceRender(n => n + 1);
  }, []);

  const undo = () => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current -= 1;
    restoreHistory(historyIdxRef.current);
  };

  const redo = () => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current += 1;
    restoreHistory(historyIdxRef.current);
  };

  const deleteSelected = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    const active = c.getActiveObject();
    if (!active) return;
    c.remove(active);
    c.discardActiveObject();
    c.renderAll();
    saveHistory(c);
  }, [saveHistory]);

  // Keyboard Delete/Backspace listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if user is editing text
        const active = fabricRef.current?.getActiveObject();
        if (active && active instanceof fabric.IText && (active as fabric.IText).isEditing) return;
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleteSelected]);

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

    const getPointer = (opt: any) => {
      if (typeof c.getScenePoint === 'function') return c.getScenePoint(opt.e);
      return c.getPointer(opt.e);
    };

    const onMouseDown = (opt: any) => {
      if (tool === 'select' || tool === 'free') return;
      const pointer = getPointer(opt);
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

    const onMouseMove = (opt: any) => {
      if (!isDrawingRef.current || !startPosRef.current || !tempObjRef.current) return;
      const pointer = getPointer(opt);
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

  const addSign = async (signo: SignoObraDB) => {
    const c = fabricRef.current;
    if (!c) return;
    try {
      const url = signo.imagen_url;
      const isSvg =
        url.startsWith('data:image/svg+xml') ||
        /\.svg(\?|$)/i.test(url);

      if (isSvg) {
        // Load SVG as text and convert to fabric group
        let svgText: string;
        if (url.startsWith('data:image/svg+xml;base64,')) {
          svgText = atob(url.split(',')[1]);
        } else if (url.startsWith('data:image/svg+xml')) {
          svgText = decodeURIComponent(url.split(',')[1]);
        } else {
          const resp = await fetch(url);
          svgText = await resp.text();
        }
        const result = await fabric.loadSVGFromString(svgText);
        const group = fabric.util.groupSVGElements(
          result.objects.filter(Boolean) as fabric.FabricObject[],
          result.options,
        );
        group.scaleToWidth(60);
        group.set({ left: c.getWidth() / 2 - 30, top: c.getHeight() / 2 - 30 });
        c.add(group);
        c.setActiveObject(group);
      } else {
        // Raster image (PNG/JPG/WebP)
        const img = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
        img.scaleToWidth(60);
        img.set({ left: c.getWidth() / 2 - 30, top: c.getHeight() / 2 - 30 });
        c.add(img);
        c.setActiveObject(img);
      }
      c.renderAll();
      saveHistory(c);
    } catch (err) {
      console.error('Error loading sign:', err);
      toast.error('No se pudo añadir la señal');
    }
  };

  const handleSave = async () => {
    const c = fabricRef.current;
    if (!c) return;
    setSaving(true);
    try {
      c.discardActiveObject();
      c.renderAll();
      const dataUrl = c.toDataURL({ format: 'png', multiplier: 2 } as any);
      if (!dataUrl || dataUrl.length < 100) {
        console.error('toDataURL returned empty or invalid data, length:', dataUrl?.length);
        toast.error('Error: no se pudo exportar el canvas');
        return;
      }
      const resp = await fetch(dataUrl);
      const blob = await resp.blob();
      if (!blob || blob.size === 0) {
        console.error('Generated blob is empty');
        toast.error('Error: imagen vacía');
        return;
      }
      console.log('Uploading edited image, blob size:', blob.size);
      const path = `${visitaId}/${Date.now()}_edited.png`;
      const { error: uploadError } = await supabase.storage.from('incidencia-fotos').upload(path, blob, {
        contentType: 'image/png',
        upsert: false,
      });
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      const { data: urlData } = supabase.storage.from('incidencia-fotos').getPublicUrl(path);
      console.log('Saved edited image URL:', urlData.publicUrl);
      await onSave(urlData.publicUrl);
      toast.success('Imagen editada guardada');
      onClose();
    } catch (err) {
      console.error('Save error:', err);
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
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/80" style={{ minHeight: TOOLBAR_HEIGHT }}>
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

        <Button variant="ghost" size="sm" onClick={undo} disabled={historyIdxRef.current <= 0} className="h-8 w-8 p-0">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={redo} disabled={historyIdxRef.current >= historyRef.current.length - 1} className="h-8 w-8 p-0">
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={deleteSelected} title="Borrar seleccionado" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        <Button variant="ghost" size="sm" onClick={() => setShowSigns(!showSigns)} className="h-8 text-xs gap-1 px-2">
          🚧 <span className="hidden sm:inline">Señales</span>
          {!isTabletOrBelow && (showSigns ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />)}
        </Button>

        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-white hover:text-white">
          <X className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 gap-1">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </Button>
      </div>

      {/* Canvas + Signs panel */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex items-center justify-center relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          <canvas ref={canvasRef} />
        </div>

        {showSigns && !isMobile && (
          <div className="w-48 border-l border-border flex flex-col bg-card">
            <div className="p-2 border-b border-border">
              <p className="text-xs font-semibold mb-2">Señales de obra</p>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-1 pb-2">
                  {categorias.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCatId(cat.id)}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors flex-shrink-0 ${
                        selectedCatId === cat.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {cat.nombre}
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {signosFiltrados.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center mt-4">
                  No hay señales en esta categoría
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {signosFiltrados.map(s => (
                    <button
                      key={s.id}
                      onClick={() => addSign(s)}
                      className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-muted transition-colors"
                      title={s.nombre}
                    >
                      <img
                        src={s.imagen_url}
                        alt={s.nombre}
                        className="w-10 h-10 object-contain"
                      />
                      <span className="text-[9px] text-muted-foreground text-center leading-tight line-clamp-2">{s.nombre}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile: signs as bottom sheet */}
      {isMobile && (
        <Sheet open={showSigns} onOpenChange={setShowSigns}>
          <SheetContent side="bottom" className="h-[60vh] p-4 overflow-y-auto z-[60]">
            <SheetHeader className="mb-3">
              <SheetTitle className="text-sm">Señales de obra</SheetTitle>
            </SheetHeader>
            <ScrollArea className="w-full whitespace-nowrap mb-3">
              <div className="flex gap-2 pb-2">
                {categorias.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCatId(cat.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex-shrink-0 ${
                      selectedCatId === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {cat.nombre}
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            {signosFiltrados.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center mt-6">
                No hay señales en esta categoría
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {signosFiltrados.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { addSign(s); setShowSigns(false); }}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg active:bg-muted transition-colors"
                    title={s.nombre}
                  >
                    <img
                      src={s.imagen_url}
                      alt={s.nombre}
                      className="w-12 h-12 object-contain"
                    />
                    <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-2">{s.nombre}</span>
                  </button>
                ))}
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
