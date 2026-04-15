

# Plan: Reproducir completamente el Acta de Reunión CAE (10 páginas, 13 secciones)

## Análisis del documento

El documento tiene 10 páginas con 13 puntos del orden del día. Actualmente solo recogemos: datos básicos, asistentes, actividades, empresas, riesgos, texto legal y firma. Falta la mayor parte del contenido del acta.

## Estructura completa del documento vs. lo que ya tenemos

```text
PÁGINA 1: Cabecera + Asistentes + Firma conformidad     ✅ parcial (falta firma)
PÁGINA 2: Orden del día (índice)                          ❌ no existe
PÁGINA 3: 1. Objetivo y alcance (texto fijo)              ❌
           Tabla actividades                              ✅ ya existe
           2. Intercambio documentación (texto fijo)       ❌
           Tabla empresas contacto                        ✅ ya existe
PÁGINA 4: Checklist documentación (checkboxes fijos)      ❌
           3. Trabajos realizados y previstos              ❌
           Riesgos previstos (checkboxes)                 ✅ parcial
PÁGINA 5: 3.1 Empresas que intervienen (tabla nueva)      ❌
           3.2 Duración y ubicación trabajos (tabla nueva) ❌
           3.3 Trabajos a realizar (texto editable)       ❌
PÁGINA 6: 4. Recurso preventivo (texto editable)          ❌
           5. Acuerdos generales (texto fijo + editable)   ❌
PÁGINA 7: 5 cont. + Medios coord. + Vigilancia + Acceso  ❌ (todo texto fijo/legal)
           6. Formación e información (texto fijo)         ❌
PÁGINA 8: 7. Control maquinaria (texto fijo)              ❌
           8. Protecciones colectivas (texto fijo)         ❌
           9. Protecciones individuales (texto fijo)       ❌
PÁGINA 9: 10. Interferencias entre empresas (sí/no + texto) ❌
           11. Interferencias con terceros (sí/no + texto)  ❌
           12. Medio ambiente (sí/no)                       ❌
PÁGINA 10: 13. Ruegos y sugerencias (sí/no + texto)       ❌
```

## Clasificación de contenido

### A) Texto fijo (plantilla) — se carga desde `texto_acta_reunion_cae` en Configuración
Puntos 1, 2 (párrafos legales), 5 (acuerdos generales), 6, 7, 8, 9 son en su mayoría texto legal estándar que no cambia entre actas. Ya tenemos un campo `texto_acta_reunion_cae` en configuración para esto.

### B) Datos dinámicos ya recogidos
- Asistentes, actividades, empresas de contacto, riesgos, mes, lugar, actuación

### C) Datos dinámicos que FALTAN y necesitamos recoger en el formulario

| Campo nuevo | Tipo | Sección del doc |
|---|---|---|
| `texto_trabajos_realizar` | RichText editable | 3.3 |
| `texto_recurso_preventivo` | RichText editable | 4 |
| `empresas_intervienen` | Array tabla (razón social, acrónimo, responsable) | 3.1 |
| `duracion_trabajos` | Array tabla (título, inicio, fin, observaciones) | 3.2 |
| `interferencias_empresas_aplica` | boolean | 10 |
| `interferencias_empresas_texto` | text | 10 |
| `interferencias_terceros_aplica` | boolean | 11 |
| `interferencias_terceros_texto` | text | 11 |
| `medio_ambiente_aplica` | boolean | 12 |
| `medio_ambiente_texto` | text | 12 |
| `ruegos_aplica` | boolean | 13 |
| `ruegos_texto` | text | 13 |
| `notas_generales` | text | Notas sueltas |

## Cambios a realizar

### 1. Ampliar `FormActaReunion.tsx` (sección CAE)

Añadir los campos nuevos al formulario, organizados en secciones colapsables o pestañas para que no sea abrumador:

- **Sección 3.1**: Tabla dinámica "Empresas que intervienen" (razón social, acrónimo, persona responsable) — similar a las tablas que ya tenemos de asistentes/empresas
- **Sección 3.2**: Tabla dinámica "Duración y ubicación" (título trabajo, fecha inicio, fecha fin, observaciones)
- **Sección 3.3**: RichTextEditor para "Trabajos a realizar" (texto libre descriptivo)
- **Sección 4**: RichTextEditor para "Recurso preventivo"
- **Secciones 10-13**: Bloques con checkbox Sí/No + textarea condicional para cada uno (interferencias empresas, interferencias terceros, medio ambiente, ruegos)

Todos estos campos se guardan dentro de `datos_extra` del documento.

### 2. Reescribir `templateActaReunion` en la edge function

Actualmente genera unas 2 páginas. Hay que expandirla para reproducir las 10 páginas del acta real:

- Cabecera con logo en cada página (header repetido con protocolo CAE, fecha, página X de Y, actuación preventiva)
- Página 1: tabla asistentes con columnas DNI/NIE y Firma + texto conformidad
- Página 2: Orden del día (generado automáticamente)
- Páginas 3-10: Los 13 puntos con su contenido (mezcla de texto fijo del template de configuración + datos dinámicos del formulario + tablas)

El texto fijo de los puntos 1, 2, 5, 6, 7, 8, 9 se renderizará desde `texto_acta_reunion_cae` de configuración. Los puntos con datos dinámicos (3.1, 3.2, 3.3, 4, 10, 11, 12, 13) inyectarán los valores del formulario.

### 3. No se necesita migración SQL

Todos los campos nuevos van dentro de `datos_extra` (jsonb) que ya existe en `documentos_obra`. Las tablas dinámicas de "empresas que intervienen" y "duración trabajos" también se pueden guardar como arrays en `datos_extra` para simplificar (no requieren tablas SQL separadas como los asistentes).

## Archivos afectados

- **`src/components/documentos/formularios/FormActaReunion.tsx`** — ampliar formulario con todos los campos nuevos para CAE
- **`supabase/functions/generar-documento-pdf/index.ts`** — reescribir `templateActaReunion` para generar las 10 páginas completas
- **`src/types/documentos.ts`** — actualizar `DatosActaReunionCAE` con los campos nuevos

## Nota importante

Este es un cambio grande. El formulario pasará de ~15 campos a ~30+ campos. La edge function `templateActaReunion` pasará de ~120 líneas a ~400+ líneas. Recomiendo implementarlo en un solo paso para evitar inconsistencias entre formulario y PDF.

