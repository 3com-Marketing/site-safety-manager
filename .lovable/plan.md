## Objetivo

Hacer que el **Acta de Nombramiento (CAE y con Proyecto)** entre en **una sola página A4** al exportar a PDF.

## Diagnóstico

El template `templateActaNombramiento` (en `supabase/functions/generar-documento-pdf/index.ts`, líneas 153-231) usa `baseStyles()` con `@page { margin: 2cm }` y tamaños generosos. Con las 3 tablas (Proyecto, Promotor, Coordinador), el texto legal y el bloque de firma, normalmente desborda a una segunda página.

## Cambios en `supabase/functions/generar-documento-pdf/index.ts` (solo función `templateActaNombramiento`)

Sin tocar el resto de plantillas (informes, otras actas).

### 1. Reducir margen de página (solo para esta acta)
Inyectar al inicio del HTML un bloque `<style>@page { margin: 1.2cm 1.5cm !important; }</style>` que sobrescribe el del `baseStyles` para esta plantilla.

### 2. Cabecera más compacta
- Logo SafeWork: `max-height: 80pt` → **46pt**, `margin-bottom: 16pt` → **4pt**.
- Título "ACTA DE NOMBRAMIENTO": `16pt` → **13pt**.
- Subtítulo: `10pt` → **8.5pt**, margen reducido.
- Margen inferior del bloque cabecera: `20pt` → **8pt**.

### 3. Títulos de sección (h2)
- Tamaño: `11pt` → **9.5pt**.
- Borde inferior: `2px` → **1.5px**.
- `margin-top: 20pt` → **8pt**, `margin-bottom` añadido **3pt**.

### 4. Tablas de datos
- Padding celdas: `6pt 10pt` → **2.5pt 6pt**.
- Tamaño de letra: `9pt` → **8.5pt**.
- `margin: 8pt 0` → **2pt 0**.

### 5. Texto legal
- Fuente: `10pt` → **8.5pt**.
- `line-height: 1.6` → **1.35**.
- `margin-top: 20pt` → **8pt**.

### 6. Bloque de firma
- Fecha: `margin-top: 24pt` → **10pt**, fuente `10pt` → **9pt**.
- Línea de firmas: `margin-top: 60pt` → **30pt**.
- Anchos de firma: `200pt` → **180pt**, fuente `9pt` → **8.5pt**, padding `8pt` → **5pt**.

## Notas

- Cambios aislados al template de Acta de Nombramiento — no afectan a Acta de Aprobación, Acta de Reunión ni Informes CSS/AT.
- Si en algún caso muy extremo (texto legal muy largo) sigue desbordando, queda margen para reducir más el `line-height` del texto legal o el tamaño de fuente, pero con estos valores debería entrar en una página con el texto legal habitual.

## QA

Tras aplicar, generaré un PDF de prueba del acta CAE y verificaré visualmente que:
- Todo cabe en 1 sola página.
- Los textos no quedan apretados ni cortados.
- El logo y los títulos se siguen leyendo bien.