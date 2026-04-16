

# Plan: Mover "Punto 1" dentro de las secciones ampliadas del Acta CAE

## Problema

La sección "1. Objetivo, alcance y ámbito de actuación" (texto legal + tabla actividades/nº pedido) está fuera del bloque "Secciones ampliadas del Acta CAE". El usuario quiere que aparezca como la primera sección colapsable dentro de ese bloque, igual que 3.1, 3.2, etc.

## Cambio

**Archivo**: `src/components/documentos/formularios/FormActaReunion.tsx`

1. Eliminar el bloque `SectionCollapsible` del Punto 1 que está en las líneas 388-417 (fuera de las secciones ampliadas).
2. Moverlo dentro del bloque "Secciones ampliadas del Acta CAE" (línea 469), como la primera `SectionCollapsible` antes de "3.1 — Empresas que intervienen".
3. Se mantiene exactamente igual: RichTextEditor para el texto del punto 1 + tabla de actividades con columnas Actividad y Número de pedido.

Solo es un reordenamiento visual — sin cambios en lógica ni en datos.

