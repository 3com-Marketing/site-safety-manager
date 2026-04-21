

# Plan: Añadir segundo bloque del Punto 2 — Checkboxes y texto legal adicional

## Resumen

Después del texto legal y la tabla de empresas del Punto 2 actual, añadir los checkboxes de documentación requerida, un segundo bloque de texto legal editable (con las viñetas sobre plazos, planificación y comunicación), y los checkboxes "No procede" / "Otros".

## Cambios

### 1. Migración SQL

Añadir columna para el segundo bloque de texto legal:

```sql
ALTER TABLE configuracion_empresa
ADD COLUMN texto_cae_punto2_bloque2 text NOT NULL DEFAULT '';
```

### 2. `AdminConfiguracion.tsx`

En el acordeón "Acta Reunión CAE", después del editor del Punto 2 actual, añadir otro RichTextEditor etiquetado **"Punto 2 — Bloque 2 (compromisos documentales)"** para `texto_cae_punto2_bloque2`. Actualizar interfaz y EMPTY_CONFIG.

### 3. `FormActaReunion.tsx`

Dentro de la `SectionCollapsible` "2. Intercambio de documentación", después de la tabla de empresas, añadir en este orden:

1. **4 checkboxes** de documentación:
   - "La documentación completa en materia preventiva y administrativa de Empresa y Trabajadores"
   - "La relación nominal completa de trabajadores (Nombre, Apellidos, N.I.F. ó Pasaporte o N.I.E.)"
   - "La relación completa de maquinaria, medios auxiliares y/o productos químicos, si procede"
   - "La relación de los trabajos a realizar (tipología o zona de afectación)"

2. **Texto legal editable** (RichTextEditor) precargado desde `texto_cae_punto2_bloque2` de configuración — contendrá las viñetas sobre plazos de 72h, planificación semanal, comunicación entre empresas, plataforma metacontratas, etc.

3. **Checkboxes finales**: "No procede" y "Otros" (con campo de texto libre si se marca Otros)

**Nuevos estados:**
- `textoPunto2Bloque2` (string)
- `punto2DocPreventiva`, `punto2DocTrabajadores`, `punto2DocMaquinaria`, `punto2DocTrabajos` (booleans)
- `punto2NoProcede` (boolean)
- `punto2Otros` (string)

**Guardado en `datos_extra`:**
```json
{
  "texto_punto2_bloque2": "...",
  "punto2_doc_preventiva": true,
  "punto2_doc_trabajadores": true,
  "punto2_doc_maquinaria": false,
  "punto2_doc_trabajos": true,
  "punto2_no_procede": false,
  "punto2_otros": ""
}
```

## Archivos afectados
- **Migración SQL**: nueva columna `texto_cae_punto2_bloque2`
- **`src/pages/AdminConfiguracion.tsx`** — nuevo editor en el acordeón CAE
- **`src/components/documentos/formularios/FormActaReunion.tsx`** — checkboxes + segundo texto legal + No procede/Otros

