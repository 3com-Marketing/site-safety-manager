

# Plan: Reorganizar textos legales en Configuración por tipo de documento

## Resumen

Separar la sección actual "Textos Legales por Defecto" (que mezcla todos los documentos en una lista larga) en un apartado independiente con acordeones o tarjetas colapsables, una por cada tipo de documento. Cada acordeón se abre para editar el texto legal de ese documento concreto.

## Diseño

La sección de textos legales pasará de ser una Card con 9 RichTextEditors apilados a usar un componente `Accordion` (que ya existe en el proyecto) con un item por cada tipo de documento:

```text
┌─────────────────────────────────────────────┐
│ 📄 Plantillas de Documentos                │
├─────────────────────────────────────────────┤
│ ▶ Informe CSS / AT                         │
│   └ Recomendaciones (RichText)             │
│   └ Normativa aplicable (RichText)         │
│                                             │
│ ▶ Acta Nombramiento CAE                    │
│   └ Texto legal (RichText)                 │
│                                             │
│ ▶ Acta Nombramiento con Proyecto           │
│   └ Texto legal (RichText)                 │
│                                             │
│ ▶ Acta Aprobación Plan SyS                 │
│   └ Texto legal (RichText)                 │
│                                             │
│ ▶ Acta Aprobación DGPO                     │
│   └ Texto legal (RichText)                 │
│                                             │
│ ▶ Acta Reunión Inicial                     │
│   └ Texto legal (RichText)                 │
│                                             │
│ ▶ Acta Reunión CAE                         │
│   └ Texto legal (RichText)                 │
│                                             │
│ ▶ Acta Reunión SyS                         │
│   └ Texto legal (RichText)                 │
└─────────────────────────────────────────────┘
```

## Cambio concreto

**Archivo**: `src/pages/AdminConfiguracion.tsx`

1. Reemplazar la Card "Textos Legales por Defecto (Informes)" por una nueva Card "Plantillas de Documentos".
2. Dentro, usar `Accordion` con `type="multiple"` y un `AccordionItem` por cada tipo de documento.
3. Cada AccordionItem contiene los RichTextEditors que corresponden a ese documento (informes tiene 2: recomendaciones + normativa; el resto tiene 1 cada uno).
4. Importar `Accordion, AccordionItem, AccordionTrigger, AccordionContent` desde `@/components/ui/accordion`.

No hay cambios en base de datos ni en funcionalidad. Solo reorganización visual.

## Archivos afectados
- `src/pages/AdminConfiguracion.tsx`

