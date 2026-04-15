

# Plan: Hacer visibles los informes CSS/AT para admin + actualizar texto recomendaciones

## Problema identificado

Los tipos `informe_css` e `informe_at` tienen `TIPO_DOCUMENTO_ROL` configurado como `'tecnico'` en `src/types/documentos.ts`. Esto hace que el filtro en `NuevoDocumentoDialog` los oculte cuando el usuario es admin (el filtro solo muestra tipos con rol `'ambos'` o que coincidan con el rol actual).

## Cambios

### 1. `src/types/documentos.ts` — Cambiar rol de informes a 'ambos'

Cambiar `informe_css` e `informe_at` de `'tecnico'` a `'ambos'` para que admin también pueda crearlos.

Igualmente cambiar `acta_reunion_inicial` y `acta_reunion_sys` de `'tecnico'` a `'ambos'` por coherencia (el admin también debería poder crear cualquier documento).

### 2. Texto de recomendaciones — Ya actualizado

El texto de recomendaciones ya fue insertado en `configuracion_empresa.texto_recomendaciones` en el paso anterior. Si no se guardó correctamente, se volverá a ejecutar el UPDATE con el texto exacto proporcionado.

## Archivos afectados
- **Editado**: `src/types/documentos.ts` (cambiar roles de tecnico a ambos)
- **Datos**: Verificar/actualizar `configuracion_empresa.texto_recomendaciones` si es necesario

