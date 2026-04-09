
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'tecnico');

-- User roles table (per security guidelines)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nombre TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nombre, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS for user_roles
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Clientes
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view clientes" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage clientes" ON public.clientes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Obras
CREATE TABLE public.obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  direccion TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view obras" ON public.obras FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage obras" ON public.obras FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Visitas
CREATE TABLE public.visitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado TEXT NOT NULL DEFAULT 'en_progreso' CHECK (estado IN ('en_progreso', 'finalizada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visitas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view visitas" ON public.visitas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create visitas" ON public.visitas FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own visitas" ON public.visitas FOR UPDATE TO authenticated USING (auth.uid() = usuario_id OR public.has_role(auth.uid(), 'admin'));

-- Informes
CREATE TABLE public.informes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visita_id UUID REFERENCES public.visitas(id) ON DELETE CASCADE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'pendiente_revision', 'cerrado')),
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.informes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view informes" ON public.informes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create informes" ON public.informes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins and owners can update informes" ON public.informes FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (SELECT 1 FROM public.visitas WHERE visitas.id = informes.visita_id AND visitas.usuario_id = auth.uid())
);

-- Incidencias
CREATE TABLE public.incidencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  informe_id UUID REFERENCES public.informes(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  categoria TEXT NOT NULL CHECK (categoria IN ('EPIs', 'orden_limpieza', 'altura', 'señalizacion', 'maquinaria')),
  orden INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.incidencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view incidencias" ON public.incidencias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create incidencias" ON public.incidencias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins and owners can update incidencias" ON public.incidencias FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.informes
    JOIN public.visitas ON visitas.id = informes.visita_id
    WHERE informes.id = incidencias.informe_id AND visitas.usuario_id = auth.uid()
  )
);
CREATE POLICY "Admins and owners can delete incidencias" ON public.incidencias FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.informes
    JOIN public.visitas ON visitas.id = informes.visita_id
    WHERE informes.id = incidencias.informe_id AND visitas.usuario_id = auth.uid()
  )
);

-- Fotos
CREATE TABLE public.fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incidencia_id UUID REFERENCES public.incidencias(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view fotos" ON public.fotos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create fotos" ON public.fotos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins and owners can delete fotos" ON public.fotos FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.incidencias
    JOIN public.informes ON informes.id = incidencias.informe_id
    JOIN public.visitas ON visitas.id = informes.visita_id
    WHERE incidencias.id = fotos.incidencia_id AND visitas.usuario_id = auth.uid()
  )
);

-- Storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('incidencia-fotos', 'incidencia-fotos', true);

CREATE POLICY "Anyone can view photos" ON storage.objects FOR SELECT USING (bucket_id = 'incidencia-fotos');
CREATE POLICY "Authenticated can upload photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'incidencia-fotos');
CREATE POLICY "Authenticated can delete own photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'incidencia-fotos');
