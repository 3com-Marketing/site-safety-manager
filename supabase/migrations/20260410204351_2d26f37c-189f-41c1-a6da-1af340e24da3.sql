ALTER TABLE public.visitas
  ADD CONSTRAINT visitas_usuario_id_profiles_fkey
  FOREIGN KEY (usuario_id) REFERENCES public.profiles(user_id);