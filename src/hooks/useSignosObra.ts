import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SignoCategoria {
  id: string;
  nombre: string;
  orden: number;
  activa: boolean;
}

export interface SignoObraDB {
  id: string;
  nombre: string;
  categoria_id: string;
  imagen_url: string;
  activa: boolean;
  orden: number;
  archivo_original?: string | null;
}

export function useSignoCategorias(opts?: { soloActivas?: boolean }) {
  const soloActivas = opts?.soloActivas ?? true;
  return useQuery({
    queryKey: ['signo_categorias', soloActivas],
    queryFn: async () => {
      let q = supabase.from('signo_categorias').select('*').order('orden', { ascending: true });
      if (soloActivas) q = q.eq('activa', true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as SignoCategoria[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSignosObra(opts?: { soloActivas?: boolean }) {
  const soloActivas = opts?.soloActivas ?? true;
  return useQuery({
    queryKey: ['signos_obra', soloActivas],
    queryFn: async () => {
      let q = supabase.from('signos_obra').select('*').order('orden', { ascending: true });
      if (soloActivas) q = q.eq('activa', true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as SignoObraDB[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
