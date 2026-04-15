import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

export type DocumentoConRelaciones = Documento & {
  asistentes_reunion?: Asistente[];
  actividades_reunion_cae?: ActividadCAE[];
  empresas_acceso_obra?: EmpresaAcceso[];
};

export function useDocumentosObra(obraId: string) {
  const queryClient = useQueryClient();

  const { data: documentos, isLoading } = useQuery({
    queryKey: ['documentos-obra', obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentos_obra')
        .select('*, asistentes_reunion(*), actividades_reunion_cae(*), empresas_acceso_obra(*)')
        .eq('obra_id', obraId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DocumentoConRelaciones[];
    },
    enabled: !!obraId,
  });

  const crearDocumento = useMutation({
    mutationFn: async (payload: {
      tipo: TipoDocumento;
      datos: Record<string, unknown>;
      asistentes?: Array<Record<string, string>>;
      actividades?: Array<Record<string, string>>;
      empresas?: Array<Record<string, string>>;
    }) => {
      const { asistentes, actividades, empresas, datos, tipo } = payload;

      const { data: doc, error } = await supabase
        .from('documentos_obra')
        .insert({
          obra_id: obraId,
          tipo,
          estado: 'generado' as EstadoDocumento,
          fecha_documento: datos.fecha_firma as string || new Date().toISOString().split('T')[0],
          nombre_coordinador: datos.nombre_coordinador as string,
          dni_coordinador: datos.dni_coordinador as string,
          titulacion_colegiado: datos.titulacion_colegiado as string,
          empresa_coordinacion: datos.empresa_coordinacion as string,
          cif_empresa: datos.cif_empresa as string,
          domicilio_empresa: datos.domicilio_empresa as string,
          movil_coordinador: datos.movil_coordinador as string,
          email_coordinador: datos.email_coordinador as string,
          nombre_promotor: datos.nombre_promotor as string,
          cif_promotor: datos.cif_promotor as string,
          domicilio_promotor: datos.domicilio_promotor as string,
          datos_extra: datos,
          titulo: datos.titulo as string || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (asistentes?.length && doc) {
        await supabase.from('asistentes_reunion').insert(
          asistentes.map((a) => ({ ...a, documento_id: doc.id }))
        );
      }

      if (actividades?.length && doc) {
        await supabase.from('actividades_reunion_cae').insert(
          actividades.map((a, i) => ({ ...a, documento_id: doc.id, orden: i }))
        );
      }

      if (empresas?.length && doc) {
        await supabase.from('empresas_acceso_obra').insert(
          empresas.map(e => ({ ...e, documento_id: doc.id }))
        );
      }

      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-obra', obraId] });
      toast.success('Documento creado');
    },
    onError: () => toast.error('Error al crear documento'),
  });

  const actualizarDocumento = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<'documentos_obra'> }) => {
      const { error } = await supabase
        .from('documentos_obra')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-obra', obraId] });
      toast.success('Documento actualizado');
    },
    onError: () => toast.error('Error al actualizar documento'),
  });

  const actualizarEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: EstadoDocumento }) => {
      const { error } = await supabase
        .from('documentos_obra')
        .update({ estado })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentos-obra', obraId] }),
    onError: () => toast.error('Error al actualizar estado'),
  });

  const adjuntarArchivo = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const ext = file.name.split('.').pop();
      const path = `${obraId}/${id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos-obra')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documentos-obra')
        .getPublicUrl(path);

      const { error } = await supabase
        .from('documentos_obra')
        .update({
          archivo_url: publicUrl,
          archivo_nombre: file.name,
          estado: 'adjuntado' as EstadoDocumento,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-obra', obraId] });
      toast.success('Archivo adjuntado');
    },
    onError: () => toast.error('Error al subir archivo'),
  });

  const eliminarDocumento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('documentos_obra').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-obra', obraId] });
      toast.success('Documento eliminado');
    },
    onError: () => toast.error('Error al eliminar documento'),
  });

  // Inline mutations for related data (asistentes, actividades, empresas)
  const addAsistente = useMutation({
    mutationFn: async (asistente: TablesInsert<'asistentes_reunion'>) => {
      const { data, error } = await supabase.from('asistentes_reunion').insert(asistente).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentos-obra', obraId] }),
  });

  const deleteAsistente = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('asistentes_reunion').delete().eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentos-obra', obraId] }),
  });

  const addActividad = useMutation({
    mutationFn: async (actividad: TablesInsert<'actividades_reunion_cae'>) => {
      const { data, error } = await supabase.from('actividades_reunion_cae').insert(actividad).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentos-obra', obraId] }),
  });

  const deleteActividad = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('actividades_reunion_cae').delete().eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentos-obra', obraId] }),
  });

  const addEmpresa = useMutation({
    mutationFn: async (empresa: TablesInsert<'empresas_acceso_obra'>) => {
      const { data, error } = await supabase.from('empresas_acceso_obra').insert(empresa).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentos-obra', obraId] }),
  });

  const deleteEmpresa = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('empresas_acceso_obra').delete().eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentos-obra', obraId] }),
  });

  return {
    documentos,
    isLoading,
    crearDocumento,
    actualizarDocumento,
    actualizarEstado,
    adjuntarArchivo,
    eliminarDocumento,
    addAsistente,
    deleteAsistente,
    addActividad,
    deleteActividad,
    addEmpresa,
    deleteEmpresa,
  };
}
