## Objetivo

Hacer que el PDF de **Acta Aprobación DGPO** salga en una **sola página A4**, con la misma estética compacta que ya usa el **Acta de Nombramiento (Obra con Proyecto)**, manteniendo todos los datos propios de la DGPO (actuación, agentes, coordinadora actividades empresariales, empresa contratista titular, texto legal y firmas).

De paso se corrige un bug detectado durante la revisión: el formulario guarda los campos con un nombre y la plantilla del PDF los lee con otro distinto, por lo que muchos valores aparecen vacíos en el PDF actual.

## Diagnóstico

El **Acta de Nombramiento** ya cabe en una página gracias a:

- `@page { margin: 1.2cm 1.5cm }` (márgenes reducidos solo para ese tipo)
- Cabecera compacta (logo 46pt, título 13pt, subtítulo 8.5pt)
- Secciones con `h2` de 9.5pt y tablas con padding `2.5pt 6pt`, fuente 8.5pt
- Texto legal a 8.5pt, line-height 1.35
- Firma compacta justo debajo

El **Acta Aprobación DGPO** actualmente usa:

- Márgenes globales de 2cm
- Logo de 80pt + título 16pt + subtítulo 10pt
- Tabla con padding 6pt/10pt y fuente 9pt, márgenes verticales 16pt
- Texto legal a 10pt con line-height 1.6
- Bloques de firmas con margen-top 24pt

Resultado: ocupa entre 2 y 3 páginas dependiendo del texto legal.

Además, `FormActaAprobacion.tsx` guarda en `datos_extra` claves como `localidad`, `coord_ss_proyecto`, `autor_estudio_ss`, `coord_actividades_empresariales`, `empresa_contratista_dgpo`, mientras que la plantilla del PDF lee `localidad_situacion`, `coordinador_proyecto`, `autor_estudio_syss`, `coordinadora_actividades`, `empresa_contratista`. Por eso varias filas del PDF salen en blanco.

## Cambios propuestos

### 1. `supabase/functions/generar-documento-pdf/index.ts` — `templateActaAprobacion`

Solo cuando `isDGPO === true`:

- Inyectar un `<style>@page { margin: 1.2cm 1.5cm !important; size: A4; }</style>` al inicio (igual que el Acta de Nombramiento).
- Cabecera compacta: logo `max-height:46pt`, `h1` 13pt, subtítulo 8.5pt, márgenes mínimos.
- Tabla de datos: `h2` 9.5pt con borde rojo inferior, celdas con `padding:2.5pt 6pt`, fuente 8.5pt, columna etiqueta 35% con fondo gris claro. Reagrupar visualmente en dos bloques cortos:
  - "DATOS DE LA OBRA" (Actuación, Localidad, Promotor)
  - "AGENTES DEL PROYECTO" (Autor proyecto, Coord. SS proyecto, Autor estudio SS, Director obra, Coordinadora actividades empresariales, Empresa contratista titular)
- Texto legal a 8.5pt, line-height 1.35, margen superior 6-8pt.
- Línea de "En {lugar}, a {fecha}." compactada (margen-top 8pt, fuente 9pt).
- `firmaRecuadros` queda igual (ya es compacto y cabe).

Plan SyS (`!isDGPO`) sigue intacto, sin tocar.

### 2. Corrección de mapeo de campos

Para que el PDF muestre todos los datos que el técnico/admin rellena, alinear nombres entre formulario y plantilla. La forma más segura y sin migraciones es **leer ambos nombres en la plantilla** con fallback:

```ts
extra.localidad_situacion || extra.localidad
extra.coordinador_proyecto || extra.coord_ss_proyecto
extra.autor_estudio_syss   || extra.autor_estudio_ss
extra.coordinadora_actividades || extra.coord_actividades_empresariales
extra.empresa_contratista  || extra.empresa_contratista_dgpo
```

Así los documentos antiguos siguen funcionando y los nuevos también.

### 3. Lo que NO cambia

- `templateActaNombramiento` y el resto de plantillas.
- El formulario `FormActaAprobacion.tsx` (campos, validaciones, firma).
- Plan SyS, Reuniones, Informes.
- Estilos base (`baseStyles`, `informeStyles`).

## Archivos a modificar

- `supabase/functions/generar-documento-pdf/index.ts` (función `templateActaAprobacion`, ~líneas 249-307).

## Verificación tras implementar

1. Abrir un Acta Aprobación DGPO existente desde `/admin/documentos`, generar PDF y comprobar que sale en **1 página**.
2. Comprobar que todos los campos del formulario aparecen rellenos en el PDF.
3. Generar un Acta Aprobación Plan SyS y verificar que **no ha cambiado** su layout.
4. Generar un Acta de Nombramiento (Obra con Proyecto) y verificar que sigue en una página, sin cambios.
