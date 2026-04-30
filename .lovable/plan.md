## Objetivo

Cada técnico/coordinador recibe automáticamente un **código único e irrepetible** al darse de alta, con formato `TEC-0001` o `COORD-0001`. Además, al asignar obras, mostrar un aviso si una obra ya tiene otro técnico/coordinador (sin bloquear).

## Cambios

### 1. Base de datos (migración)

**Nueva secuencia + función + trigger** para generar el código en el alta:

```sql
-- Secuencias separadas por tipo
CREATE SEQUENCE IF NOT EXISTS public.tecnicos_codigo_tec_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.tecnicos_codigo_coord_seq START 1;

-- Función que asigna el código si está vacío
CREATE OR REPLACE FUNCTION public.assign_codigo_tecnico()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.codigo_tecnico IS NULL OR NEW.codigo_tecnico = '' THEN
    IF NEW.tipo = 'coordinador' THEN
      NEW.codigo_tecnico := 'COORD-' || LPAD(nextval('public.tecnicos_codigo_coord_seq')::text, 4, '0');
    ELSE
      NEW.codigo_tecnico := 'TEC-' || LPAD(nextval('public.tecnicos_codigo_tec_seq')::text, 4, '0');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_codigo_tecnico
  BEFORE INSERT ON public.tecnicos
  FOR EACH ROW EXECUTE FUNCTION public.assign_codigo_tecnico();

-- Backfill de los registros existentes que no tengan código
-- (UPDATE en bloque, ordenado por created_at, generando TEC-XXXX / COORD-XXXX)

-- Índice único parcial (ignora cadenas vacías históricas)
CREATE UNIQUE INDEX IF NOT EXISTS tecnicos_codigo_unique
  ON public.tecnicos (codigo_tecnico)
  WHERE codigo_tecnico <> '';

-- Avanzar las secuencias para que el siguiente nextval no choque con backfill
SELECT setval('public.tecnicos_codigo_tec_seq',
  GREATEST(1, (SELECT COALESCE(MAX(NULLIF(regexp_replace(codigo_tecnico, '\D','','g'),''))::int, 0)
               FROM public.tecnicos WHERE codigo_tecnico LIKE 'TEC-%')));
SELECT setval('public.tecnicos_codigo_coord_seq',
  GREATEST(1, (SELECT COALESCE(MAX(NULLIF(regexp_replace(codigo_tecnico, '\D','','g'),''))::int, 0)
               FROM public.tecnicos WHERE codigo_tecnico LIKE 'COORD-%')));
```

### 2. `src/pages/AdminTecnicos.tsx`

- **Quitar** el input editable "Código de técnico" del diálogo de creación. Lo reemplaza un texto informativo: *"Se generará automáticamente al guardar (TEC-XXXX / COORD-XXXX)."*
- En **edición**, el campo se muestra como **solo lectura** (no se puede modificar).
- Al guardar (insert), no enviar `codigo_tecnico` (lo asigna el trigger). Tras crear, refrescar para mostrar el código generado y mostrar `toast.success` con el código asignado: *"Creado con código TEC-0007"*.
- En el listado y la ficha (`Eye`), seguir mostrando el código tal cual.

### 3. Aviso de duplicado en asignación de obras

En el mismo diálogo (sección "Obras asignadas"), al marcar una obra que ya está vinculada a otro técnico/coordinador del mismo `tipo`:

- Junto a esa obra, mostrar un badge ámbar pequeño: *"Ya asignada a: Juan Pérez"*.
- No bloquea el guardado. Cuando varios marcan la misma obra, todos quedan vinculados.
- También aplica en `src/pages/AdminObras.tsx` (sección de asignación de técnicos en el alta de obra): badge ámbar en los técnicos que ya están en otra obra... no, ahí no aplica (la regla es por obra). Se omite.

## Detalles técnicos

- El trigger es `BEFORE INSERT` y solo asigna si el campo viene vacío, así no rompe inserts existentes ni el backfill.
- Las secuencias son por tipo, así los `TEC-` y `COORD-` no comparten contador.
- El índice es parcial (`WHERE codigo_tecnico <> ''`) para tolerar registros antiguos sin código durante el backfill, aunque el backfill rellena todos.
- RLS: no cambia. `tecnicos` ya tiene "Admins can manage tecnicos" y SELECT abierto a authenticated.
- No se toca `tecnicos.tipo` ni `tecnicos_obras` (el "perfil doble" y la "vista de coordinador para vincular obras" quedan fuera de este cambio, según tu selección).

## Lo que NO se incluye

- Perfil doble (mismo usuario actuando como técnico en una obra y coordinador en otra).
- Pantalla específica de coordinador para autovincular obras.
- Bloqueo de asignación múltiple por obra.

Si más adelante quieres alguno de estos puntos, abrimos un plan aparte: el de "perfil doble" requiere mover el `tipo` a `tecnicos_obras` y es un refactor más amplio.

## Resultado esperado

1. Crear un nuevo técnico → al guardar aparece `TEC-0008` (o el siguiente). Crear coordinador → `COORD-0003`. No se puede editar a mano.
2. Editar un técnico ya existente → su código se ve en gris, no editable.
3. Al asignar obras, si marcas una que ya tiene otro técnico del mismo rol, ves "Ya asignada a: Nombre"; puedes guardar igual.
