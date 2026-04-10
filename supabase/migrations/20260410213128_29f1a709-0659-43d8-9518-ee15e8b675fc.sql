-- Obras: ubicación fija de la obra
ALTER TABLE public.obras ADD COLUMN latitud double precision;
ALTER TABLE public.obras ADD COLUMN longitud double precision;

-- Visitas: ubicación del técnico al iniciar y finalizar
ALTER TABLE public.visitas ADD COLUMN lat_inicio double precision;
ALTER TABLE public.visitas ADD COLUMN lng_inicio double precision;
ALTER TABLE public.visitas ADD COLUMN lat_fin double precision;
ALTER TABLE public.visitas ADD COLUMN lng_fin double precision;