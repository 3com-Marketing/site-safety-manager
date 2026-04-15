import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { TIPO_DOCUMENTO_LABELS } from '@/types/documentos';

export type Documento = Tables<'documentos_obra'>;
export type Asistente = Tables<'asistentes_reunion'>;
export type ActividadCAE = Tables<'actividades_reunion_cae'>;
export type EmpresaAcceso = Tables<'empresas_acceso_obra'>;

export type TipoDocumento = Documento['tipo'];
export type EstadoDocumento = Documento['estado'];

// Re-export for backward compatibility
export const TIPO_LABELS = TIPO_DOCUMENTO_LABELS as Record<string, string>;

export const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  generado: 'Generado',
  adjuntado: 'Adjuntado',
  firmado: 'Firmado',
};

export function useDocumentosObra() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [documentos, setDocumentos] = useState<Documento[]>([]);

  const fetchDocumentos = useCallback(async (obraId?: string) => {
    setLoading(true);
    let query = supabase.from('documentos_obra').select('*').order('created_at', { ascending: false });
    if (obraId) query = query.eq('obra_id', obraId);
    const { data, error } = await query;
    if (error) toast.error('Error al cargar documentos');
    setDocumentos(data || []);
    setLoading(false);
    return data || [];
  }, []);

  const createDocumento = async (doc: TablesInsert<'documentos_obra'>) => {
    const payload = { ...doc, creado_por: user?.id || null };
    const { data, error } = await supabase.from('documentos_obra').insert(payload).select().single();
    if (error) { toast.error('Error al crear documento'); return null; }
    toast.success('Documento creado');
    return data;
  };

  const updateDocumento = async (id: string, updates: TablesUpdate<'documentos_obra'>) => {
    const { error } = await supabase.from('documentos_obra').update(updates).eq('id', id);
    if (error) { toast.error('Error al actualizar documento'); return false; }
    toast.success('Documento actualizado');
    return true;
  };

  const deleteDocumento = async (id: string) => {
    const { error } = await supabase.from('documentos_obra').delete().eq('id', id);
    if (error) { toast.error('Error al eliminar documento'); return false; }
    toast.success('Documento eliminado');
    return true;
  };

  const uploadArchivo = async (documentoId: string, file: File) => {
    const ext = file.name.split('.').pop();
    const path = `${documentoId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('documentos-obra').upload(path, file);
    if (uploadError) { toast.error('Error al subir archivo'); return null; }
    const { data: urlData } = supabase.storage.from('documentos-obra').getPublicUrl(path);
    const url = urlData.publicUrl;
    const { error } = await supabase.from('documentos_obra').update({
      archivo_url: url,
      archivo_nombre: file.name,
      estado: 'adjuntado' as EstadoDocumento,
    }).eq('id', documentoId);
    if (error) { toast.error('Error al vincular archivo'); return null; }
    toast.success('Archivo adjuntado');
    return url;
  };

  // Asistentes
  const fetchAsistentes = async (documentoId: string) => {
    const { data } = await supabase.from('asistentes_reunion').select('*').eq('documento_id', documentoId).order('created_at');
    return data || [];
  };

  const addAsistente = async (asistente: TablesInsert<'asistentes_reunion'>) => {
    const { data, error } = await supabase.from('asistentes_reunion').insert(asistente).select().single();
    if (error) { toast.error('Error al añadir asistente'); return null; }
    return data;
  };

  const deleteAsistente = async (id: string) => {
    await supabase.from('asistentes_reunion').delete().eq('id', id);
  };

  // Actividades CAE
  const fetchActividades = async (documentoId: string) => {
    const { data } = await supabase.from('actividades_reunion_cae').select('*').eq('documento_id', documentoId).order('orden');
    return data || [];
  };

  const addActividad = async (actividad: TablesInsert<'actividades_reunion_cae'>) => {
    const { data, error } = await supabase.from('actividades_reunion_cae').insert(actividad).select().single();
    if (error) { toast.error('Error al añadir actividad'); return null; }
    return data;
  };

  const deleteActividad = async (id: string) => {
    await supabase.from('actividades_reunion_cae').delete().eq('id', id);
  };

  // Empresas acceso
  const fetchEmpresas = async (documentoId: string) => {
    const { data } = await supabase.from('empresas_acceso_obra').select('*').eq('documento_id', documentoId);
    return data || [];
  };

  const addEmpresa = async (empresa: TablesInsert<'empresas_acceso_obra'>) => {
    const { data, error } = await supabase.from('empresas_acceso_obra').insert(empresa).select().single();
    if (error) { toast.error('Error al añadir empresa'); return null; }
    return data;
  };

  const deleteEmpresa = async (id: string) => {
    await supabase.from('empresas_acceso_obra').delete().eq('id', id);
  };

  return {
    documentos, loading,
    fetchDocumentos, createDocumento, updateDocumento, deleteDocumento, uploadArchivo,
    fetchAsistentes, addAsistente, deleteAsistente,
    fetchActividades, addActividad, deleteActividad,
    fetchEmpresas, addEmpresa, deleteEmpresa,
  };
}
