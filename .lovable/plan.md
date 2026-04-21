

# Plan: Agrandar botones de voz en Datos Generales

## Problema

Los botones de "Voz" en la sección Datos Generales son enlaces de texto tiny (`text-xs`) que son difíciles de pulsar con el dedo en móvil/tablet. Las otras secciones (Incidencias, Observaciones, etc.) ya usan botones más grandes con la clase `field-action-btn`.

## Solución

Reemplazar los 3 botones de voz inline en `SeccionDatosGenerales.tsx` por botones tipo pill/chip con un tamaño mínimo de toque de 44x44px (estándar de accesibilidad táctil), con icono de micrófono de Lucide y texto "Voz" visible.

## Cambios

### `src/components/visita/SeccionDatosGenerales.tsx`

Cambiar los 3 botones de voz de:
```tsx
<button className="flex items-center gap-1 text-xs text-primary font-medium">
  🎤 Voz
</button>
```

A un botón tipo pill touch-friendly:
```tsx
<button className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold min-h-[44px] min-w-[44px] active:bg-primary/20 transition-colors">
  <Mic className="h-4 w-4" />
  Voz
</button>
```

Esto da:
- Area de toque minima de 44px (recomendacion Apple/Google)
- Fondo con color para que sea visible como boton
- Icono de Lucide `Mic` en vez del emoji (mas consistente con el resto de la app)
- Feedback tactil con `active:bg-primary/20`

## Archivos afectados
- **`src/components/visita/SeccionDatosGenerales.tsx`** -- 3 botones de voz mas grandes

