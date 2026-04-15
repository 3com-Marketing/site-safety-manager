

# Plan: Auto-rellenar los `[....]` del texto legal con datos del formulario

## Resumen

Cuando se carga el texto legal desde Configuración en un Acta de Nombramiento nueva, los marcadores `[....]` se sustituyen automáticamente por los valores del formulario (domicilio del promotor, nombre del coordinador, nº colegiado). Si el usuario cambia esos campos, el texto se actualiza en tiempo real.

## Cambio concreto

**Archivo**: `src/components/documentos/formularios/FormActaNombramiento.tsx`

1. Guardar el texto plantilla original de configuración en un `useRef` (para poder re-aplicar sustituciones cuando cambien los campos).

2. Crear una función que recorra el texto HTML y reemplace cada `[....]` en orden por los valores correspondientes:
   - 1er `[....]` → `domicilioPromotor`
   - 2º `[....]` → `nombreCoordinador`  
   - 3er `[....]` → `titulacionColegiado` (nº colegiado)

3. Ejecutar esa sustitución:
   - Al cargar el texto desde configuración (documento nuevo)
   - Cuando cambien `domicilioPromotor`, `nombreCoordinador` o `titulacionColegiado` (solo si hay plantilla base)

4. El texto resultante se muestra en el RichTextEditor y es editable. Al guardar, se persiste el texto final (con los valores reales, no con corchetes).

## Archivos afectados
- `src/components/documentos/formularios/FormActaNombramiento.tsx`

