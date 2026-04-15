

# Plan: Ampliar campos de configuración de empresa

## Resumen

Añadir campos adicionales a la tabla `configuracion_empresa` para datos bancarios y registro mercantil.

## Cambios

### 1. Migración BD — Nuevos campos

```sql
ALTER TABLE public.configuracion_empresa
  ADD COLUMN registro_mercantil text NOT NULL DEFAULT '',
  ADD COLUMN iban text NOT NULL DEFAULT '',
  ADD COLUMN banco text NOT NULL DEFAULT '',
  ADD COLUMN swift_bic text NOT NULL DEFAULT '';
```

### 2. AdminConfiguracion.tsx — Nuevas tarjetas

Añadir dos nuevas secciones (Cards) al formulario:

- **Datos Mercantiles**: campo "Registro Mercantil" (ej: "Tomo X, Folio Y, Hoja Z")
- **Datos Bancarios**: campos IBAN, Banco, SWIFT/BIC

### Archivos afectados
- **Migración**: añadir 4 columnas a `configuracion_empresa`
- **Editado**: `src/pages/AdminConfiguracion.tsx` (nuevos campos en el formulario)

