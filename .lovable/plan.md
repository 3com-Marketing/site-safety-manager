

# Plan: Normativa Automática + Generación de PDF

## Resumen
Dos funcionalidades principales:
1. **Normativa automática**: Al crear/mejorar anotaciones e incidencias con IA, el sistema sugiere automáticamente la normativa aplicable (Real Decreto, artículo) vinculada a lo descrito.
2. **Generación de PDF**: El admin puede generar un PDF profesional del informe completo desde `AdminInformeDetalle`.

---

## Parte 1: Normativa Automática

### Modificar edge function `mejorar-texto`
- Ampliar el prompt del sistema para que, además de mejorar el texto, devuelva la normativa aplicable.
- Usar tool calling (structured output) para extraer: `texto_mejorado` + `normativa` (array de `{referencia, descripcion}`).
- Ejemplo de normativa: `"RD 1627/1997, Anexo IV, Parte C, punto 2 — Protección contra caídas de altura"`.

### Modificar respuesta del edge function
- Devolver `{ texto_mejorado, normativa: [{referencia, descripcion}] }`.

### DB: Añadir columna `normativa` a tablas
- Migración: añadir columna `normativa text default ''` a `anotaciones`, `incidencias`, `observaciones`, `amonestaciones`.
- Almacena la normativa sugerida como texto (o JSON serializado).

### Modificar componentes de captura
- En `ChecklistBloque`, `SeccionIncidencias`, `SeccionAmonestaciones`, `SeccionObservaciones`: al recibir la respuesta de IA, guardar también la normativa.
- Mostrar la normativa debajo del texto mejorado en el diálogo de edición y en la lista de anotaciones, con estilo visual diferenciado (badge o caja con icono de ley).

### Modificar `VoiceNoteDialog`
- Añadir sección que muestra la normativa sugerida debajo del texto mejorado.
- El hook `useVoiceNote` almacenará también `normativa` en su estado.

---

## Parte 2: Generación de PDF

### Nueva edge function `generar-pdf`
- Recibe `informe_id`.
- Consulta todas las tablas del informe: datos generales, checklist (bloques + anotaciones), incidencias (+ fotos), amonestaciones, observaciones.
- Genera un PDF profesional con estructura:
  1. Portada: logo SafeWork, nombre obra, fecha, técnico
  2. Datos generales: trabajadores, clima, empresas, notas
  3. Checklist por categoría: cada bloque con sus anotaciones (texto + normativa + foto si hay)
  4. Incidencias: listado con fotos y normativa
  5. Amonestaciones: con trabajador y descripción
  6. Observaciones generales
- Usa la librería `jsPDF` o similar disponible en Deno para generar el PDF.
- Devuelve el PDF como `application/pdf` o lo sube a storage y devuelve la URL.

### Modificar `AdminInformeDetalle.tsx`
- El botón "Generar PDF" llama a la edge function.
- Muestra spinner durante la generación.
- Al recibir el PDF, lo descarga automáticamente o abre en nueva pestaña.
- Mostrar también las secciones de checklist, amonestaciones, observaciones (actualmente solo muestra incidencias).

### Ampliar la vista de detalle del informe
- Añadir secciones colapsables para: Datos Generales, Checklist (por bloque), Amonestaciones, Observaciones.
- Cada sección muestra sus datos con la normativa asociada.

---

## Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `supabase/functions/mejorar-texto/index.ts` | Modificar: añadir normativa al prompt + tool calling |
| `supabase/functions/generar-pdf/index.ts` | Crear: generación de PDF completo |
| Migración SQL | Crear: añadir columna `normativa` a 4 tablas |
| `src/hooks/useVoiceNote.ts` | Modificar: gestionar estado de normativa |
| `src/components/visita/VoiceNoteDialog.tsx` | Modificar: mostrar normativa sugerida |
| `src/components/visita/ChecklistBloque.tsx` | Modificar: guardar normativa al crear anotación |
| `src/components/visita/SeccionIncidencias.tsx` | Modificar: guardar normativa |
| `src/components/visita/SeccionAmonestaciones.tsx` | Modificar: guardar normativa |
| `src/components/visita/SeccionObservaciones.tsx` | Modificar: guardar normativa |
| `src/pages/AdminInformeDetalle.tsx` | Modificar: vista completa + descarga PDF funcional |

---

## Detalle técnico

### Tool calling para normativa (en `mejorar-texto`)
```json
{
  "name": "mejorar_y_normar",
  "parameters": {
    "texto_mejorado": "string",
    "normativa": [{
      "referencia": "RD 1627/1997, Art. 11",
      "descripcion": "Obligaciones del coordinador en materia de seguridad"
    }]
  }
}
```

### PDF (en edge function)
- Generado server-side con fetch de todos los datos.
- Subido a storage bucket `incidencia-fotos` (o nuevo bucket `informes-pdf`).
- Devuelve URL pública para descarga.

