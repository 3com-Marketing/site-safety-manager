import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Devuelve la URL pública de la firma guardada en el perfil del técnico actual (o null). */
export function useFirmaPerfilUrl() {
  const [firmaUrl, setFirmaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) { setLoading(false); } return; }
      const { data } = await supabase
        .from('tecnicos')
        .select('firma_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (active) {
        setFirmaUrl(data?.firma_url || null);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return { firmaUrl, loading };
}

/**
 * Sube una firma asociada a un documento al bucket `logos/firmas-documentos/`.
 * Devuelve la URL pública.
 */
export async function uploadFirmaDocumento(documentoId: string, blob: Blob): Promise<string> {
  const path = `firmas-documentos/${documentoId}_${Date.now()}.png`;
  const { error } = await supabase.storage
    .from('logos')
    .upload(path, blob, { contentType: 'image/png', upsert: true });
  if (error) throw error;
  return supabase.storage.from('logos').getPublicUrl(path).data.publicUrl;
}
