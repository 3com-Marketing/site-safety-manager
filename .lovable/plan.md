

# Plan: Ampliar tabla de técnicos con rol coordinador y campos adicionales

## Resumen

Añadir campos que faltan en la tabla `tecnicos` para cubrir la ficha completa de coordinadores/técnicos, y añadir un campo `tipo` para distinguir entre "técnico" y "coordinador".

## Campos a añadir en la tabla `tecnicos`

Basándome en el ejemplo proporcionado, faltan estos campos:

| Campo | Tipo | Ejemplo |
|-------|------|---------|
| `tipo` | text (default 'tecnico') | 'tecnico' o 'coordinador' |
| `apellidos` | text | ARTILES LORENZO |
| `dni` | text | 42876574-C |
| `titulacion` | text | INGENIERA TECNICA INDUSTRIAL |
| `num_colegiado` | text | 1903 (COGITILPA) |
| `empresa` | text | HERNÁNDEZ CONSULTORES EN SEGURIDAD Y SALUD LABORAL, S.L. |
| `cif_empresa` | text | B-76247162 |
| `movil` | text | 660 826 771 |

Nota: `nombre`, `direccion`, `telefono`, `email`, `codigo_tecnico`, `notas` ya existen.

## Cambios

### 1. Migración SQL
Añadir las 8 columnas nuevas a la tabla `tecnicos` con defaults vacíos.

### 2. `AdminTecnicos.tsx`
- Añadir pestañas o filtro "Técnicos" / "Coordinadores" para separar la vista.
- Ampliar el formulario de creación/edición con todos los campos nuevos (DNI, apellidos, titulación, nº colegiado, empresa, CIF empresa, móvil).
- Actualizar la ficha de visualización (dialog "Ver") con los campos nuevos.
- Actualizar la interfaz `Tecnico` y el `emptyForm`.
- Botón "Nuevo coordinador" además de "Nuevo técnico".

### 3. Tipos TypeScript
Actualizar la interfaz local `Tecnico` en el componente (los tipos de Supabase se regeneran automáticamente).

## Archivos afectados
- **Migración**: nueva migración para ALTER TABLE tecnicos ADD COLUMN (8 columnas)
- **Editado**: `src/pages/AdminTecnicos.tsx` — formulario ampliado, filtro por tipo, ficha completa

