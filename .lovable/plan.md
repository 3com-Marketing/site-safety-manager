# Reordenar bloque de firmas: etiquetas arriba

## Cambio

En `supabase/functions/generar-documento-pdf/index.ts`, modificar el helper `firmaRecuadros()` para invertir el orden: las etiquetas van **encima** del recuadro y la firma se hace dentro.

## Resultado

```text
┌──────────────────────────────┐   ┌──────────────────────────────┐
│ FIRMA DEL TÉCNICO INSPECTOR: │   │ FIRMA RESPONSABLE EMPRESA:   │
├──────────────────────────────┤   ├──────────────────────────────┤
│                              │   │    Recibí nombre y cargo     │
│                              │   │                              │
│      (espacio firma)         │   │      (espacio firma)         │
│                              │   │                              │
└──────────────────────────────┘   └──────────────────────────────┘
```

## Detalles

- Recuadro único con borde alrededor.
- Primera fila interna: etiqueta en **negrita** centrada con borde inferior (línea separadora).
  - Izquierda: "FIRMA DEL TÉCNICO INSPECTOR:"
  - Derecha: "FIRMA RESPONSABLE DE LA EMPRESA:"
- Resto del recuadro: zona de firma vacía (~80pt).
- En el recuadro derecho, justo bajo la línea separadora, aparece "Recibí nombre y cargo" centrado, fuente pequeña, gris.
- Ambos recuadros mantienen exactamente la misma altura total.
