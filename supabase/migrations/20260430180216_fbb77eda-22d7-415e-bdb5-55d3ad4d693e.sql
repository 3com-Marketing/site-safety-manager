
-- 1. Secuencias separadas por tipo
CREATE SEQUENCE IF NOT EXISTS public.tecnicos_codigo_tec_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.tecnicos_codigo_coord_seq START 1;

-- 2. Backfill: asignar códigos a registros existentes que no los tengan
DO $$
DECLARE
  r RECORD;
  next_tec INT := 0;
  next_coord INT := 0;
BEGIN
  -- Calcular el siguiente número disponible analizando códigos previos válidos
  SELECT COALESCE(MAX((regexp_replace(codigo_tecnico, '\D', '', 'g'))::int), 0)
    INTO next_tec
    FROM public.tecnicos
    WHERE codigo_tecnico ~ '^TEC-\d+$';

  SELECT COALESCE(MAX((regexp_replace(codigo_tecnico, '\D', '', 'g'))::int), 0)
    INTO next_coord
    FROM public.tecnicos
    WHERE codigo_tecnico ~ '^COORD-\d+$';

  -- Recorrer registros sin código y asignar uno
  FOR r IN
    SELECT id, tipo
    FROM public.tecnicos
    WHERE codigo_tecnico IS NULL OR codigo_tecnico = ''
       OR (codigo_tecnico !~ '^TEC-\d+$' AND codigo_tecnico !~ '^COORD-\d+$')
    ORDER BY created_at
  LOOP
    IF r.tipo = 'coordinador' THEN
      next_coord := next_coord + 1;
      UPDATE public.tecnicos
        SET codigo_tecnico = 'COORD-' || LPAD(next_coord::text, 4, '0')
        WHERE id = r.id;
    ELSE
      next_tec := next_tec + 1;
      UPDATE public.tecnicos
        SET codigo_tecnico = 'TEC-' || LPAD(next_tec::text, 4, '0')
        WHERE id = r.id;
    END IF;
  END LOOP;

  -- Avanzar las secuencias para no chocar con los códigos ya existentes
  PERFORM setval('public.tecnicos_codigo_tec_seq', GREATEST(1, next_tec));
  PERFORM setval('public.tecnicos_codigo_coord_seq', GREATEST(1, next_coord));
END $$;

-- 3. Índice único sobre códigos no vacíos
CREATE UNIQUE INDEX IF NOT EXISTS tecnicos_codigo_tecnico_unique
  ON public.tecnicos (codigo_tecnico)
  WHERE codigo_tecnico IS NOT NULL AND codigo_tecnico <> '';

-- 4. Función que asigna el código en INSERT si viene vacío
CREATE OR REPLACE FUNCTION public.assign_codigo_tecnico()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
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

-- 5. Trigger BEFORE INSERT
DROP TRIGGER IF EXISTS trg_assign_codigo_tecnico ON public.tecnicos;
CREATE TRIGGER trg_assign_codigo_tecnico
  BEFORE INSERT ON public.tecnicos
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_codigo_tecnico();
