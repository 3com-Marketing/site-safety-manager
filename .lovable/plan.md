

# Plan: Botones de voz mucho mas grandes en Datos Generales

## Problema

Los botones de voz siguen apareciendo pequenos (posible cache). Ademas, el usuario quiere que sean significativamente mas grandes, ocupando todo el ancho disponible junto al label, no solo un chip pequeno alineado a la derecha.

## Solucion

Convertir los botones de voz en botones grandes de ancho completo (`w-full`), con altura generosa (`h-14`), icono grande y texto claro. Colocarlos debajo del label y encima del textarea, como un boton de accion principal para cada campo.

## Cambios

### `src/components/visita/SeccionDatosGenerales.tsx`

Para cada uno de los 3 campos con voz (condiciones, empresas, notas), cambiar el layout de:
- Label + boton pequeno en la misma linea
- Textarea debajo

A:
- Label arriba
- Boton de voz grande (`w-full h-14 rounded-xl bg-primary/10 text-primary`) con icono `Mic` de 24px y texto "Dictar por voz"
- Textarea debajo

```tsx
<div className="space-y-2">
  <Label className="font-heading text-sm font-semibold">Condiciones climaticas</Label>
  <button
    onClick={() => openVoiceForField('condiciones')}
    className="flex items-center justify-center gap-2 w-full h-14 rounded-xl bg-primary/10 text-primary text-base font-semibold active:bg-primary/20 transition-colors"
  >
    <Mic className="h-6 w-6" />
    Dictar por voz
  </button>
  <Textarea ... />
</div>
```

Esto da:
- Boton de 56px de alto y ancho completo: imposible de fallar con el dedo
- Icono de 24px bien visible
- Texto "Dictar por voz" mas descriptivo
- El textarea sigue disponible debajo para editar manualmente

## Archivos afectados
- **`src/components/visita/SeccionDatosGenerales.tsx`** -- 3 botones de voz a formato grande full-width

