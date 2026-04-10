
-- Add new columns to clientes
ALTER TABLE public.clientes
  ADD COLUMN cif text NOT NULL DEFAULT '',
  ADD COLUMN telefono text NOT NULL DEFAULT '',
  ADD COLUMN email text NOT NULL DEFAULT '',
  ADD COLUMN ciudad text NOT NULL DEFAULT '',
  ADD COLUMN tipo_cliente text NOT NULL DEFAULT 'Promotora',
  ADD COLUMN notas text NOT NULL DEFAULT '';

-- Create contactos_cliente table
CREATE TABLE public.contactos_cliente (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  cargo text NOT NULL DEFAULT '',
  telefono text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contactos_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view contactos_cliente"
  ON public.contactos_cliente FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage contactos_cliente"
  ON public.contactos_cliente FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
