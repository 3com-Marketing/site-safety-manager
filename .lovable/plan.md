

# Plan: Migración — Tablas de documentos de obra

## Cambios

### 1. Migración SQL
Ejecutar el SQL proporcionado que crea:
- 2 enums: `tipo_documento`, `estado_documento`
- 4 tablas: `documentos_obra`, `asistentes_reunion`, `actividades_reunion_cae`, `empresas_acceso_obra`
- RLS policies para admins (full) y técnicos (sus obras asignadas)
- Trigger `updated_at` en `documentos_obra`

### 2. Storage bucket
Crear bucket `documentos-obra` (public) para archivos firmados.

### 3. Ajuste menor al SQL
- Los técnicos necesitan política UPDATE además de SELECT e INSERT en `documentos_obra` — añadiré una política UPDATE para técnicos en sus obras asignadas.

| Acción | Detalle |
|---|---|
| Migración SQL | Crear enums, 4 tablas, RLS, trigger |
| Storage | Crear bucket `documentos-obra` |

