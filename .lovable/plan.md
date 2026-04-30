# Autocompletado inteligente en formularios de documentos

Añadir sugerencias en vivo en los campos de nombre (técnico, coordinador, promotor, autores, directores...) dentro de los formularios de informes/actas. Al seleccionar una sugerencia, se rellenan automáticamente todos los datos asociados, dejando los campos editables.

## Comportamiento

- Sugerencias **desde el primer carácter**, máx. 8 resultados, con debounce 150 ms.
- Cada sugerencia muestra: **nombre + dato identificativo** (código `TEC-0001`/`COORD-0001` y nº de obras asignadas; para promotores, CIF y ciudad).
- Al elegir, se **rellenan todos los campos relacionados** del bloque (datos personales, empresa, contacto, titulación, firma...).
- Los campos rellenados quedan **editables** sin perder la sugerencia.
- Para campos de "rol por obra" (coordinador vs técnico), se filtra por `tipo` cuando aplica; si no aplica, se muestran ambos.

## Fuentes de datos

- **Personas (técnicos / coordinadores)** → tabla `tecnicos`. Búsqueda por `nombre`, `apellidos`, `codigo_tecnico`, `email` (`ilike`).
- **Promotor / Razón social** → tabla `clientes` (búsqueda por `nombre`, `cif`).

Sin migraciones de BD: las RLS actuales ya permiten lectura a usuarios autenticados.

## Componentes nuevos

`src/components/documentos/AutocompleteNombre.tsx`
- Wrapper sobre un `Input` con un popover de sugerencias (basado en `Command` de shadcn ya disponible).
- Props:
  - `value`, `onChange(text)` — control normal del input.
  - `source: 'tecnico' | 'coordinador' | 'persona' | 'cliente'` — define tabla y filtro `tipo`.
  - `onSelect(payload)` — recibe el registro completo seleccionado para que el formulario rellene sus campos.
  - `placeholder`, `id`, `className`.
- Lógica: `useEffect` con debounce dispara `supabase.from('tecnicos').select(...).or('nombre.ilike.%x%,apellidos.ilike.%x%,codigo_tecnico.ilike.%x%').limit(8)` (o `clientes` según source). Se omite la búsqueda si el texto coincide exactamente con la última selección (evita reabrir el popover tras autorrelleno).
- Cada item: línea 1 `Nombre Apellidos` · línea 2 (muted): código + email/obras / o CIF + ciudad.

`src/hooks/useAutocompletePersonas.ts` (helper opcional)
- Encapsula el query con React Query (`['ac-personas', source, q]`, `staleTime: 30s`).

## Integración en los formularios

En cada formulario, se sustituye el `Input` por `AutocompleteNombre` en los campos de nombre, y se añade un handler que rellena el resto de campos del bloque con los datos del registro elegido. El usuario podrá modificar después cualquier valor.

### `FormInforme.tsx`
- Campo: **Nombre del técnico** → `source='tecnico'`. Al seleccionar:
  - `nombre_tecnico` ← `nombre + apellidos`
  - (no hay más campos en este form, pero se guarda el `tecnico_id` en `datos_extra.tecnico_id` para futuras consultas).

### `FormActaNombramiento.tsx`
- **Nombre y apellidos (Coordinador/a)** → `source='coordinador'`. Rellena: `dni`, `titulacion`/`num_colegiado` → `titulacion_colegiado`, `empresa` → `empresa_coordinacion`, `cif_empresa`, `direccion` → `domicilio_empresa`, `movil`, `email`.
- **Nombre / Razón Social (Promotor)** → `source='cliente'`. Rellena: `cif_promotor`, `domicilio_promotor` ← `ciudad`.

### `FormActaAprobacion.tsx`
- **Promotor** → `source='cliente'`.
- **Autor del Proyecto / Coord. SS Proyecto / Autor Estudio SS / Director de obra / Coord. SS Obra / Coord. actividades empresariales** → `source='persona'` (sin filtro por tipo). Solo rellena el texto del campo (son cadenas libres en `datos_extra`); incluye apellidos cuando existan.

### `FormActaReunion.tsx`
- **Promotor** → `source='cliente'`.
- En el sub-formulario "Añadir asistente" (`nuevoAsistente.nombre`) → `source='persona'`. Rellena `apellidos`, `cargo` (titulación), `empresa`, `dni_nie` ← `dni`.

## Detalles técnicos

- Consulta tipo (técnicos):
  ```ts
  let q = supabase.from('tecnicos')
    .select('id, nombre, apellidos, codigo_tecnico, email, dni, titulacion, num_colegiado, empresa, cif_empresa, direccion, movil, telefono, tipo')
    .limit(8);
  if (source === 'coordinador') q = q.eq('tipo', 'coordinador');
  if (source === 'tecnico') q = q.eq('tipo', 'tecnico');
  q = q.or(`nombre.ilike.%${esc}%,apellidos.ilike.%${esc}%,codigo_tecnico.ilike.%${esc}%,email.ilike.%${esc}%`);
  ```
  Escapado básico de `%` y `,` en `esc`.
- Consulta clientes:
  ```ts
  supabase.from('clientes').select('id, nombre, cif, ciudad, email, telefono')
    .or(`nombre.ilike.%${esc}%,cif.ilike.%${esc}%`).limit(8);
  ```
- Para mostrar "obras asignadas" en la sugerencia de un técnico, se hace un segundo lote ligero: `supabase.from('tecnicos_obras').select('tecnico_id').in('tecnico_id', ids)` y se cuenta; cacheado por React Query.
- El popover se cierra al seleccionar, al perder foco, o con `Esc`. No bloquea la escritura libre (si el usuario escribe un nombre que no existe, simplemente no selecciona ninguna sugerencia y el valor queda como texto).
- Accesibilidad: navegación con flechas y `Enter`, `aria-autocomplete="list"`.

## Archivos a modificar / crear

- **Crear**: `src/components/documentos/AutocompleteNombre.tsx`
- **Crear**: `src/hooks/useAutocompletePersonas.ts`
- **Editar**: `src/components/documentos/formularios/FormInforme.tsx`
- **Editar**: `src/components/documentos/formularios/FormActaNombramiento.tsx`
- **Editar**: `src/components/documentos/formularios/FormActaAprobacion.tsx`
- **Editar**: `src/components/documentos/formularios/FormActaReunion.tsx`

Sin cambios de BD, sin nuevas dependencias.
