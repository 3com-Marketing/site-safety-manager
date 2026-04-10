
CREATE TABLE public.tecnicos_obras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tecnico_id UUID NOT NULL REFERENCES public.tecnicos(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (tecnico_id, obra_id)
);

ALTER TABLE public.tecnicos_obras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view tecnicos_obras"
  ON public.tecnicos_obras FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage tecnicos_obras"
  ON public.tecnicos_obras FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
