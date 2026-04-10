ALTER TABLE anotaciones ADD COLUMN etiqueta text NOT NULL DEFAULT '';
ALTER TABLE fotos ADD COLUMN etiqueta text NOT NULL DEFAULT '';
ALTER TABLE amonestaciones ADD COLUMN etiqueta text NOT NULL DEFAULT '';
ALTER TABLE observaciones ADD COLUMN etiqueta text NOT NULL DEFAULT '';