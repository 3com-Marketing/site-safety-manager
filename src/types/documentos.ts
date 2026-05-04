export type TipoDocumento =
  | 'acta_nombramiento_cae'
  | 'acta_nombramiento_proyecto'
  | 'acta_aprobacion_dgpo'
  | 'acta_aprobacion_plan_sys'
  | 'acta_reunion_cae'
  | 'acta_reunion_inicial'
  | 'acta_reunion_sys'
  | 'informe_css'
  | 'informe_at';

export type EstadoDocumento = 'pendiente' | 'generado' | 'adjuntado' | 'firmado';

export const TIPO_DOCUMENTO_LABELS: Record<TipoDocumento, string> = {
  acta_nombramiento_cae: 'Acta Nombramiento CAE',
  acta_nombramiento_proyecto: 'Acta Nombramiento (Obra con Proyecto)',
  acta_aprobacion_dgpo: 'Acta Aprobación DGPO',
  acta_aprobacion_plan_sys: 'Acta Aprobación Plan de SYS',
  acta_reunion_cae: 'Acta Reunión CAE',
  acta_reunion_inicial: 'Acta Reunión Inicial',
  acta_reunion_sys: 'Acta Reunión SYS',
  informe_css: 'Informe CSS',
  informe_at: 'Informe AT',
};

export const TIPO_DOCUMENTO_ROL: Record<TipoDocumento, 'admin' | 'tecnico' | 'ambos'> = {
  acta_nombramiento_cae: 'admin',
  acta_nombramiento_proyecto: 'admin',
  acta_aprobacion_dgpo: 'admin',
  acta_aprobacion_plan_sys: 'admin',
  acta_reunion_cae: 'ambos',
  acta_reunion_inicial: 'ambos',
  acta_reunion_sys: 'ambos',
  informe_css: 'ambos',
  informe_at: 'ambos',
};

export const ESTADO_DOCUMENTO_COLORS: Record<EstadoDocumento, string> = {
  pendiente: 'bg-red-100 text-red-800',
  generado: 'bg-yellow-100 text-yellow-800',
  adjuntado: 'bg-blue-100 text-blue-800',
  firmado: 'bg-green-100 text-green-800',
};

// Campos por formulario de Acta de Nombramiento
export interface DatosActaNombramiento {
  denominacion: string;
  emplazamiento: string;
  tipo_obra: string;
  nombre_promotor: string;
  cif_promotor: string;
  domicilio_promotor: string;
  nombre_coordinador: string;
  dni_coordinador: string;
  titulacion_colegiado: string;
  empresa_coordinacion: string;
  cif_empresa: string;
  domicilio_empresa: string;
  movil_coordinador: string;
  email_coordinador: string;
  lugar_firma: string;
  fecha_firma: string;
}

// Campos por formulario de Acta de Aprobación DGPO
export interface DatosActaAprobacionDGPO {
  actuacion: string;
  localidad_situacion: string;
  promotor: string;
  autor_proyecto: string;
  coordinador_proyecto: string;
  autor_estudio_syss: string;
  director_obra: string;
  coordinadora_actividades: string;
  empresa_contratista: string;
  lugar_firma: string;
  fecha_firma: string;
}

// Campos por formulario de Acta de Aprobación Plan SYS
export interface DatosActaAprobacionPlanSYS {
  obra_instalacion: string;
  localidad_situacion: string;
  promotor: string;
  autor_proyecto: string;
  coordinador_proyecto: string;
  autor_estudio_syss: string;
  director_obra: string;
  coordinador_obra: string;
  empresa_contratista_titular: string;
  lugar_firma: string;
  fecha_firma: string;
}

// Campos por formulario de Acta Reunión CAE
export interface DatosActaReunionCAE {
  titulo_actuacion: string;
  mes_reunion: string;
  lugar_reunion: string;
  asistentes: Array<{
    nombre: string;
    apellidos: string;
    cargo: string;
    empresa: string;
    dni_nie?: string;
  }>;
  excusados?: string;
  actividades: Array<{
    actividad: string;
    numero_pedido?: string;
  }>;
  empresas_acceso: Array<{
    empresa: string;
    persona_contacto: string;
    email_referencia: string;
  }>;
  riesgos_previstos: {
    atrapamiento: boolean;
    arrollamiento: boolean;
    caida_altura: boolean;
    espacios_confinados: boolean;
    riesgo_electrico: boolean;
    otros: string;
  };
  plataforma_cae: string;
  notas_generales?: string;

  // 3.1 Empresas que intervienen
  empresas_intervienen?: Array<{
    razon_social: string;
    acronimo: string;
    responsable: string;
  }>;
  // 3.2 Duración y ubicación de trabajos
  duracion_trabajos?: Array<{
    titulo: string;
    inicio: string;
    fin: string;
    observaciones: string;
  }>;
  // 3.3 Trabajos a realizar
  texto_trabajos_realizar?: string;
  // 4. Recurso preventivo
  texto_recurso_preventivo?: string;
  // 10. Interferencias entre empresas
  interferencias_empresas_aplica?: boolean;
  interferencias_empresas_texto?: string;
  // 11. Interferencias con terceros
  interferencias_terceros_aplica?: boolean; // legacy
  interferencias_terceros_texto?: string;   // legacy
  punto11_procede?: 'no_procede' | 'si_procede';
  punto11_texto_procede?: string;
  punto11_texto_no_procede?: string;
  // 12. Medio ambiente
  medio_ambiente_aplica?: boolean;
  medio_ambiente_texto?: string;
  // 13. Ruegos y sugerencias
  ruegos_aplica?: boolean;
  ruegos_texto?: string;
}

// Campos por formulario de Acta Reunión Inicial / SYS
export interface DatosActaReunionInicial {
  numero_acta?: string;
  obra: string;
  localidad_situacion: string;
  promotor: string;
  lugar_reunion: string;
  fecha_reunion: string;
  asistentes: Array<{
    empresa: string;
    nombre: string;
    apellido: string;
  }>;
  notas_adicionales?: string;
}

// Campos por formulario de Informe CSS / AT
export interface DatosInforme {
  tipo_informe: 'css' | 'at';
  fecha_visita: string;
  titulo_obra: string;
  nombre_tecnico: string;
  estado_general: string;
  orden_limpieza: string;
  senalizacion_balizamiento: string;
  trabajos_altura: string;
  equipos_proteccion_colectiva: string;
  equipos_proteccion_individual: string;
  maquinaria: string;
  medios_auxiliares: string;
  recomendaciones_adicionales?: string;
}
