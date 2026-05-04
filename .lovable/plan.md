## Objetivo

Compactar el PDF del **Acta de Aprobación del Plan de Seguridad y Salud** (`acta_aprobacion_plan_sys`) a **una sola página A4**, replicando exactamente el estilo ya aplicado al Acta Aprobación DGPO y al Acta de Nombramiento.

## Cambios

### `supabase/functions/generar-documento-pdf/index.ts` — rama Plan SyS de `templateActaAprobacion` (líneas ~318-353)

Sustituir el layout actual (márgenes 2cm, logo 80pt, h1 16pt, tabla con padding 6pt/10pt, texto legal 10pt/1.6) por la misma plantilla compacta que ya usa DGPO:

- `<style>@page { margin: 1.2cm 1.5cm !important; size: A4; }</style>`
- Cabecera reducida: logo 46pt, h1 13pt, subtítulo 8.5pt
- Dos bloques con `h2` de 9.5pt y borde rojo:
  - **DATOS DE LA OBRA**: Obra/Instalación, Localidad, Promotor
  - **AGENTES DEL PROYECTO**: Autor del proyecto, Coordinador SS del proyecto, Autor estudio SyS, Director de obra, Coordinador SS de la obra, Empresa contratista/titular del Plan
- Tablas con `padding:2.5pt 6pt`, fuente 8.5pt, columna etiqueta 35% con fondo gris
- Texto legal a 8.5pt, line-height 1.35, margen-top 6pt
- "En {lugar}, a {fecha}." a 9pt, margen-top 8pt
- `firmaRecuadros(extra.firma_url)` igual

Se conservan todos los aliases con fallback ya añadidos previamente (`localidad`, `coordProyecto`, `autorEstudio`, `coordObra`, `empresaContratistaPlan`, `promotor`), por lo que los datos del formulario aparecerán correctamente.

### Lo que NO cambia

- Rama DGPO (ya compacta).
- `templateActaNombramiento` y resto de plantillas.
- Formulario `FormActaAprobacion.tsx`.
- Estilos base.

## Verificación

1. Generar PDF de un Acta Aprobación Plan SyS desde `/admin/documentos` y confirmar que sale en **1 página**.
2. Confirmar que todos los campos del formulario aparecen rellenos.
3. Volver a generar un Acta Aprobación DGPO y un Acta de Nombramiento para verificar que siguen intactas.
