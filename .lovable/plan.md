

# Plan: Ocultar "Editar foto" en la vista no editable

## Problema

En `AdminVisitaDetalle.tsx` (la vista de detalle de visita, que es de solo lectura), el `FotoViewer` tiene la prop `editable` activada. Esto muestra el boton "Editar foto" y confunde al usuario, ya que esa vista no es para editar.

## Solucion

En `src/pages/AdminVisitaDetalle.tsx`, eliminar las props `editable`, `onSave` y `visitaId` del componente `FotoViewer`. Esto hara que las fotos se abran en modo solo visualizacion (sin boton de editar).

El FotoViewer quedara simplemente como:

```tsx
<FotoViewer
  url={fotoUrl}
  onClose={() => { setFotoUrl(null); setFotoMeta(null); }}
/>
```

## Archivo afectado

- **`src/pages/AdminVisitaDetalle.tsx`** — Eliminar props `editable`, `onSave` y `visitaId` del FotoViewer (lineas 107-145).

