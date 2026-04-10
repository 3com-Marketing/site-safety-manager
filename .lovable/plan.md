

# Plan: Implementar Secciones Incidencias, Amonestaciones, Datos Generales y Observaciones

## Resumen
Completar las 4 secciones que actualmente muestran "Próximamente", reutilizando el mismo patrón UX del checklist (foto + nota por voz con IA + lista de anotaciones editables).

## Cambios en base de datos (2 migraciones)

### Migración 1: Tabla `observaciones`
```sql
CREATE TABLE public.observaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  informe_id uuid NOT NULL REFERENCES informes(id) ON DELETE CASCADE,
  texto text NOT NULL DEFAULT '',
  foto_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE observaciones ENABLE ROW LEVEL SECURITY;
-- RLS: mismo patrón que anotaciones (owner via informe->visita + admin)
```

### Migración 2: Tabla `amonestaciones`
```sql
CREATE TABLE public.amonestaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  informe_id uuid NOT NULL REFERENCES informes(id) ON DELETE CASCADE,
  trabajador text NOT NULL DEFAULT '',
  descripcion text NOT NULL DEFAULT '',
  foto_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE amonestaciones ENABLE ROW LEVEL SECURITY;
-- RLS: mismo patrón
```

### Datos Generales
No necesita tabla nueva. Añadir columnas a `informes`:
```sql
ALTER TABLE informes
  ADD COLUMN num_trabajadores integer,
  ADD COLUMN condiciones_climaticas text DEFAULT '',
  ADD COLUMN empresas_presentes text DEFAULT '',
  ADD COLUMN notas_generales text DEFAULT '';
```

## Nuevos componentes (4 archivos)

### `src/components/visita/SeccionIncidencias.tsx`
- Header con botón back + titulo
- Botones "Foto" + "Nota por voz" (reutilizando el mismo patrón de grabación + IA de ChecklistBloque)
- Al crear, inserta en tabla `incidencias` con categoria='general', titulo auto-generado
- Lista de incidencias existentes con fotos asociadas (tabla `fotos`)
- Editable y eliminable

### `src/components/visita/SeccionAmonestaciones.tsx`
- Mismo layout: foto + voz con IA
- Campo adicional "trabajador" (input texto)
- Lista de amonestaciones con descripción mejorada por IA
- Editable y eliminable

### `src/components/visita/SeccionObservaciones.tsx`
- Mismo layout: foto + voz con IA
- Lista simple de observaciones (texto + foto opcional)
- Editable y eliminable

### `src/components/visita/SeccionDatosGenerales.tsx`
- Formulario con campos editables:
  - Num. trabajadores (input numérico)
  - Condiciones climáticas (voz o texto)
  - Empresas presentes (voz o texto)
  - Notas generales (voz o texto)
- Auto-guarda al cambiar (debounce)
- Sin lista de anotaciones, es un formulario directo

## Refactor: Extraer lógica de voz + IA a hook reutilizable

### `src/hooks/useVoiceNote.ts`
Extraer de ChecklistBloque la lógica de:
- Grabación con Web Speech API
- Llamada a edge function `mejorar-texto`
- Estado del diálogo (recording/improving/editing)

Esto evita duplicar ~100 líneas en cada sección.

### `src/components/visita/VoiceNoteDialog.tsx`
Extraer el diálogo de grabación/mejora/edición como componente reutilizable.

## Modificar `VisitaActiva.tsx`
- Importar los 4 nuevos componentes
- Reemplazar el `SeccionPlaceholder` por el componente real según `seccionId`
- Pasar `informeId`, `visitaId`, `onRefresh` a cada sección
- Añadir conteos de amonestaciones y observaciones en los badges de `VisitaSecciones`

## Modificar `VisitaSecciones.tsx`
- Añadir props para `amonestacionesCount` y `observacionesCount`
- Mostrar badges en las secciones correspondientes

## UX
- Todos los botones grandes, tablet-first
- Mismo estilo visual: rounded-2xl, border-2, iconos grandes
- Flujo idéntico al checklist: entrar > foto/voz > lista > volver

