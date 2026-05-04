ALTER TABLE public.configuracion_empresa
ADD COLUMN IF NOT EXISTS texto_intro_reunion_inicial TEXT NOT NULL DEFAULT '';

UPDATE public.configuracion_empresa
SET texto_intro_reunion_inicial = '<p>{localidad}, a {fecha}, en el lugar fijado en la convocatoria, se celebra la reunión de coordinación en Materia de Seguridad y Salud Laboral con la asistencia de las siguientes empresas, cada una representada por las personas indicadas, y en concepto del cargo señalado:</p>'
WHERE COALESCE(texto_intro_reunion_inicial, '') = '';