
# Plan: Configuración de empresa propia + mejora de logos en clientes

## Resumen

Dos cosas: (1) verificar que la subida de logos de clientes funciona correctamente, y (2) crear una nueva pestaña "Configuración" con los datos de la empresa propia (SafeWork) incluyendo logo.

## Cambios

### 1. Nueva tabla `configuracion_empresa`

Tabla singleton (una sola fila) para almacenar los datos de la empresa propia:

```sql
CREATE TABLE public.configuracion_empresa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL DEFAULT '',
  cif text NOT NULL DEFAULT '',
  direccion text NOT NULL DEFAULT '',
  ciudad text NOT NULL DEFAULT '',
  telefono text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  web text NOT NULL DEFAULT '',
  logo_url text DEFAULT '',
  nombre_responsable text NOT NULL DEFAULT '',
  cargo_responsable text NOT NULL DEFAULT '',
  titulacion text NOT NULL DEFAULT '',
  num_colegiado text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: solo admins pueden gestionar, todos los autenticados pueden leer
ALTER TABLE public.configuracion_empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage config" ON public.configuracion_empresa FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth can view config" ON public.configuracion_empresa FOR SELECT TO authenticated USING (true);
```

### 2. Nueva página `AdminConfiguracion.tsx`

Formulario con los campos de la empresa: nombre, CIF, dirección, ciudad, teléfono, email, web, logo (upload al bucket `logos`), datos del responsable (nombre, cargo, titulación, nº colegiado). Usa upsert para guardar (si no existe fila, la crea; si existe, la actualiza).

### 3. AdminLayout.tsx — Nueva pestaña

Añadir pestaña "Configuración" con icono `Settings` apuntando a `/admin/configuracion`.

### 4. App.tsx — Nueva ruta

Añadir `<Route path="/admin/configuracion" element={<AdminConfiguracion />} />`.

### 5. Edge function `generar-documento-pdf` — Usar datos de empresa

Modificar la edge function para que consulte `configuracion_empresa` y use el logo y datos de la empresa propia en la cabecera del PDF en lugar de valores hardcodeados.

## Archivos afectados
- **Migración**: crear tabla `configuracion_empresa`
- **Nuevo**: `src/pages/AdminConfiguracion.tsx`
- **Editado**: `src/components/admin/AdminLayout.tsx` (nueva pestaña)
- **Editado**: `src/App.tsx` (nueva ruta)
- **Editado**: `supabase/functions/generar-documento-pdf/index.ts` (usar datos dinámicos)
