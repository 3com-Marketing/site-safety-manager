import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { useDocumentosObra, type DocumentoConRelaciones } from '@/hooks/useDocumentosObra';
import ImportarVisitaButton, { type VisitaImportData } from '@/components/documentos/ImportarVisitaButton';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface Props {
  documento?: DocumentoConRelaciones | null;
  obraId?: string;
  tipo?: string;
  onSave: (data: Record<string, any>) => Promise<void>;
  saving?: boolean;
  defaultValues?: Record<string, string>;
}

const RIESGOS_OPTIONS = [
  'Atrapamiento', 'Arrollamiento', 'Caída de altura',
  'Espacios confinados', 'Riesgo eléctrico',
];

const TIPO_TO_CONFIG_FIELD: Record<string, string> = {
  acta_reunion_inicial: 'texto_acta_reunion_inicial',
  acta_reunion_cae: 'texto_acta_reunion_cae',
  acta_reunion_sys: 'texto_acta_reunion_sys',
};

function SectionCollapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm font-semibold hover:bg-muted/60 transition-colors">
        {title}
        <ChevronDown className="h-4 w-4 transition-transform [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function FormActaReunion({ documento, obraId, tipo, onSave, saving, defaultValues }: Props) {
  const tipoActual = documento?.tipo || tipo || '';
  const isCAE = tipoActual === 'acta_reunion_cae';
  const isSYS = tipoActual === 'acta_reunion_sys';
  const effectiveObraId = obraId || documento?.obra_id || '';
  const { addAsistente, deleteAsistente, addActividad, deleteActividad, addEmpresa, deleteEmpresa } = useDocumentosObra(effectiveObraId);

  // Common fields
  const [obraActuacion, setObraActuacion] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [promotor, setPromotor] = useState('');
  const [lugarReunion, setLugarReunion] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [excusados, setExcusados] = useState('');
  const [textoLegal, setTextoLegal] = useState('');

  // CAE specific
  const [mesReunion, setMesReunion] = useState('');
  const [textoPunto1, setTextoPunto1] = useState('');
  const [textoPunto2, setTextoPunto2] = useState('');
  const [textoPunto2Bloque2, setTextoPunto2Bloque2] = useState('');
  const [punto2DocPreventiva, setPunto2DocPreventiva] = useState(false);
  const [punto2DocTrabajadores, setPunto2DocTrabajadores] = useState(false);
  const [punto2DocMaquinaria, setPunto2DocMaquinaria] = useState(false);
  const [punto2DocTrabajos, setPunto2DocTrabajos] = useState(false);
  const [punto2NoProcede, setPunto2NoProcede] = useState(false);
  const [punto2Otros, setPunto2Otros] = useState('');
  
  const [riesgos, setRiesgos] = useState<string[]>([]);
  const [otrosRiesgos, setOtrosRiesgos] = useState('');
  const [plataformaCAE, setPlataformaCAE] = useState('metacontratas');

  // SYS specific
  const [numeroActa, setNumeroActa] = useState('');

  // NEW CAE fields (sections 3.1, 3.2, 3.3, 4, 10-13)
  const [empresasIntervienen, setEmpresasIntervienen] = useState<Array<{ razon_social: string; acronimo: string; responsable: string }>>([]);
  const [duracionTrabajos, setDuracionTrabajos] = useState<Array<{ titulo: string; inicio: string; fin: string; observaciones: string }>>([]);
  const [textoPunto3, setTextoPunto3] = useState('');
  const [textoTrabajosRealizar, setTextoTrabajosRealizar] = useState('');
  const [textoRecursoPreventivo, setTextoRecursoPreventivo] = useState('');
  const [textoAcuerdosGenerales, setTextoAcuerdosGenerales] = useState('');
  const [textoPunto6, setTextoPunto6] = useState('');
  const [textoPunto7, setTextoPunto7] = useState('');
  const [textoPunto8, setTextoPunto8] = useState('');
  const [textoPunto9, setTextoPunto9] = useState('');
  const [textoPunto10, setTextoPunto10] = useState('');
  const [punto10Procede, setPunto10Procede] = useState<'no_procede' | 'si_procede'>('no_procede');
  const [punto10TextoProcede, setPunto10TextoProcede] = useState('');
  const [interferenciasTercerosAplica, setInterferenciasTercerosAplica] = useState(false);
  const [interferenciasTercerosTexto, setInterferenciasTercerosTexto] = useState('');
  const [medioAmbienteAplica, setMedioAmbienteAplica] = useState(false);
  const [medioAmbienteTexto, setMedioAmbienteTexto] = useState('');
  const [textoPunto13, setTextoPunto13] = useState('');
  const [punto13Procede, setPunto13Procede] = useState<'no_procede' | 'si_procede'>('no_procede');
  const [punto13TextoProcede, setPunto13TextoProcede] = useState('');

  // Local arrays for creation mode
  const [localAsistentes, setLocalAsistentes] = useState<Array<{ nombre: string; apellidos: string; cargo: string; empresa: string; dni_nie: string }>>([]);
  const [localActividades, setLocalActividades] = useState<Array<{ actividad: string; numero_pedido: string }>>([]);
  const [localEmpresas, setLocalEmpresas] = useState<Array<{ empresa: string; persona_contacto: string; email_referencia: string }>>([]);

  // Inline forms
  const [nuevoAsistente, setNuevoAsistente] = useState({ nombre: '', apellidos: '', cargo: '', empresa: '', dni_nie: '' });
  const [nuevaActividad, setNuevaActividad] = useState({ actividad: '', numero_pedido: '' });
  const [nuevaEmpresa, setNuevaEmpresa] = useState({ empresa: '', persona_contacto: '', email_referencia: '' });
  const [nuevaEmpresaInterviene, setNuevaEmpresaInterviene] = useState({ razon_social: '', acronimo: '', responsable: '' });
  const [nuevaDuracion, setNuevaDuracion] = useState({ titulo: '', inicio: '', fin: '', observaciones: '' });

  // Load default legal text from configuracion_empresa for new documents
  useEffect(() => {
    if (!documento && tipoActual) {
      const configField = TIPO_TO_CONFIG_FIELD[tipoActual];
      const fieldsToLoad = configField ? [configField] : [];
      if (tipoActual === 'acta_reunion_cae') {
        fieldsToLoad.push('texto_cae_punto3', 'texto_cae_punto1', 'texto_cae_punto2', 'texto_cae_punto2_bloque2', 'texto_recurso_preventivo', 'texto_acuerdos_generales', 'texto_cae_punto6', 'texto_cae_punto7', 'texto_cae_punto8', 'texto_cae_punto9', 'texto_cae_punto10', 'texto_cae_punto10_procede', 'texto_cae_punto13', 'texto_cae_punto13_procede');
      }
      if (fieldsToLoad.length > 0) {
        supabase.from('configuracion_empresa').select(fieldsToLoad.join(',')).limit(1).single().then(({ data }) => {
          if (data) {
            if (configField && (data as any)[configField]) setTextoLegal((data as any)[configField]);
            if ((data as any).texto_cae_punto3) setTextoPunto3((data as any).texto_cae_punto3);
            if ((data as any).texto_cae_punto1) setTextoPunto1((data as any).texto_cae_punto1);
            if ((data as any).texto_cae_punto2) setTextoPunto2((data as any).texto_cae_punto2);
            if ((data as any).texto_cae_punto2_bloque2) setTextoPunto2Bloque2((data as any).texto_cae_punto2_bloque2);
            if ((data as any).texto_recurso_preventivo) setTextoRecursoPreventivo((data as any).texto_recurso_preventivo);
            if ((data as any).texto_acuerdos_generales) setTextoAcuerdosGenerales((data as any).texto_acuerdos_generales);
            if ((data as any).texto_cae_punto6) setTextoPunto6((data as any).texto_cae_punto6);
            if ((data as any).texto_cae_punto7) setTextoPunto7((data as any).texto_cae_punto7);
            if ((data as any).texto_cae_punto8) setTextoPunto8((data as any).texto_cae_punto8);
            if ((data as any).texto_cae_punto9) setTextoPunto9((data as any).texto_cae_punto9);
            if ((data as any).texto_cae_punto10) setTextoPunto10((data as any).texto_cae_punto10);
            if ((data as any).texto_cae_punto10_procede) setPunto10TextoProcede((data as any).texto_cae_punto10_procede);
            if ((data as any).texto_cae_punto13) setTextoPunto13((data as any).texto_cae_punto13);
            if ((data as any).texto_cae_punto13_procede) setPunto13TextoProcede((data as any).texto_cae_punto13_procede);
          }
        });
      }
    }
  }, [documento, tipoActual]);

  useEffect(() => {
    if (documento) {
      const extra = (documento.datos_extra as Record<string, any>) || {};
      setObraActuacion(extra.obra_actuacion || '');
      setLocalidad(extra.localidad || '');
      setPromotor(documento.nombre_promotor || '');
      setLugarReunion(extra.lugar_reunion || '');
      setFechaHora(documento.fecha_documento || '');
      setExcusados(extra.excusados || '');
      setTextoLegal(extra.texto_legal || '');
      setMesReunion(extra.mes_reunion || '');
      setTextoPunto1(extra.texto_punto1 || '');
      setTextoPunto2(extra.texto_punto2 || '');
      setTextoPunto2Bloque2(extra.texto_punto2_bloque2 || '');
      setPunto2DocPreventiva(extra.punto2_doc_preventiva || false);
      setPunto2DocTrabajadores(extra.punto2_doc_trabajadores || false);
      setPunto2DocMaquinaria(extra.punto2_doc_maquinaria || false);
      setPunto2DocTrabajos(extra.punto2_doc_trabajos || false);
      setPunto2NoProcede(extra.punto2_no_procede || false);
      setPunto2Otros(extra.punto2_otros || '');
      setRiesgos(extra.riesgos || []);
      setOtrosRiesgos(extra.otros_riesgos || '');
      setPlataformaCAE(extra.plataforma_cae || 'metacontratas');
      setNumeroActa(extra.numero_acta || '');
      // New CAE fields
      setTextoPunto3(extra.texto_punto3 || '');
      setEmpresasIntervienen(extra.empresas_intervienen || []);
      setDuracionTrabajos(extra.duracion_trabajos || []);
      setTextoTrabajosRealizar(extra.texto_trabajos_realizar || '');
      setTextoRecursoPreventivo(extra.texto_recurso_preventivo || '');
      setTextoAcuerdosGenerales(extra.texto_acuerdos_generales || '');
      setTextoPunto6(extra.texto_punto6 || '');
      setTextoPunto7(extra.texto_punto7 || '');
      setTextoPunto8(extra.texto_punto8 || '');
      setTextoPunto9(extra.texto_punto9 || '');
      setTextoPunto10(extra.texto_punto10 || '');
      setPunto10Procede(extra.punto10_procede || 'no_procede');
      setPunto10TextoProcede(extra.punto10_texto_procede || '');
      setInterferenciasTercerosAplica(extra.interferencias_terceros_aplica || false);
      setInterferenciasTercerosTexto(extra.interferencias_terceros_texto || '');
      setMedioAmbienteAplica(extra.medio_ambiente_aplica || false);
      setMedioAmbienteTexto(extra.medio_ambiente_texto || '');
      setTextoPunto13(extra.texto_punto13 || '');
      setPunto13Procede(extra.punto13_procede || 'no_procede');
      setPunto13TextoProcede(extra.punto13_texto_procede || '');
    } else if (defaultValues) {
      setObraActuacion(defaultValues.nombre_obra || '');
      setLocalidad(defaultValues.direccion_obra || '');
      setPromotor(defaultValues.nombre_promotor || '');
    }
  }, [documento, defaultValues]);

  // Related data from the joined query (edit mode)
  const dbAsistentes = documento?.asistentes_reunion || [];
  const dbActividades = documento?.actividades_reunion_cae || [];
  const dbEmpresas = documento?.empresas_acceso_obra || [];

  // --- Import handler ---
  const handleImport = (data: VisitaImportData) => {
    if (data.visita.fecha_fin) {
      setFechaHora(data.visita.fecha_fin.slice(0, 16));
    } else if (data.visita.fecha) {
      setFechaHora(data.visita.fecha.slice(0, 16));
    }
    if (isCAE && data.informe.empresas_presentes) {
      const empresas = data.informe.empresas_presentes
        .split(',')
        .map(e => e.trim())
        .filter(Boolean)
        .map(e => ({ empresa: e, persona_contacto: '', email_referencia: '' }));
      setLocalEmpresas(prev => [...prev, ...empresas]);
    }
    if (isCAE && data.incidencias.length > 0) {
      const actividades = data.incidencias.map(inc => ({
        actividad: inc.titulo + (inc.descripcion ? ` — ${inc.descripcion}` : ''),
        numero_pedido: '',
      }));
      setLocalActividades(prev => [...prev, ...actividades]);
    }
    if (data.observaciones.length > 0) {
      const obsTexts = data.observaciones.map(o => o.texto).filter(Boolean);
      if (obsTexts.length > 0) {
        setExcusados(prev => {
          const existing = prev ? prev + '\n' : '';
          return existing + 'Observaciones de visita:\n' + obsTexts.join('\n');
        });
      }
    }
  };

  // --- Asistentes handlers ---
  const handleAddAsistente = async () => {
    if (!nuevoAsistente.nombre.trim()) return;
    if (documento) {
      await addAsistente.mutateAsync({ documento_id: documento.id, ...nuevoAsistente });
    } else {
      setLocalAsistentes(prev => [...prev, { ...nuevoAsistente }]);
    }
    setNuevoAsistente({ nombre: '', apellidos: '', cargo: '', empresa: '', dni_nie: '' });
  };

  const handleDeleteAsistente = async (idOrIndex: string | number) => {
    if (documento) {
      await deleteAsistente.mutateAsync(idOrIndex as string);
    } else {
      setLocalAsistentes(prev => prev.filter((_, i) => i !== idOrIndex));
    }
  };

  // --- Actividades handlers ---
  const handleAddActividad = async () => {
    if (!nuevaActividad.actividad.trim()) return;
    if (documento) {
      await addActividad.mutateAsync({ documento_id: documento.id, actividad: nuevaActividad.actividad, numero_pedido: nuevaActividad.numero_pedido || null, orden: dbActividades.length });
    } else {
      setLocalActividades(prev => [...prev, { ...nuevaActividad }]);
    }
    setNuevaActividad({ actividad: '', numero_pedido: '' });
  };

  const handleDeleteActividad = async (idOrIndex: string | number) => {
    if (documento) {
      await deleteActividad.mutateAsync(idOrIndex as string);
    } else {
      setLocalActividades(prev => prev.filter((_, i) => i !== idOrIndex));
    }
  };

  // --- Empresas handlers ---
  const handleAddEmpresa = async () => {
    if (!nuevaEmpresa.empresa.trim()) return;
    if (documento) {
      await addEmpresa.mutateAsync({ documento_id: documento.id, ...nuevaEmpresa });
    } else {
      setLocalEmpresas(prev => [...prev, { ...nuevaEmpresa }]);
    }
    setNuevaEmpresa({ empresa: '', persona_contacto: '', email_referencia: '' });
  };

  const handleDeleteEmpresa = async (idOrIndex: string | number) => {
    if (documento) {
      await deleteEmpresa.mutateAsync(idOrIndex as string);
    } else {
      setLocalEmpresas(prev => prev.filter((_, i) => i !== idOrIndex));
    }
  };

  // --- Empresas intervienen (local only, stored in datos_extra) ---
  const handleAddEmpresaInterviene = () => {
    if (!nuevaEmpresaInterviene.razon_social.trim()) return;
    setEmpresasIntervienen(prev => [...prev, { ...nuevaEmpresaInterviene }]);
    setNuevaEmpresaInterviene({ razon_social: '', acronimo: '', responsable: '' });
  };

  // --- Duración trabajos (local only, stored in datos_extra) ---
  const handleAddDuracion = () => {
    if (!nuevaDuracion.titulo.trim()) return;
    setDuracionTrabajos(prev => [...prev, { ...nuevaDuracion }]);
    setNuevaDuracion({ titulo: '', inicio: '', fin: '', observaciones: '' });
  };

  const toggleRiesgo = (r: string) => {
    setRiesgos(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const handleSubmit = () => {
    const datosExtra: Record<string, any> = {
      obra_actuacion: obraActuacion, localidad, lugar_reunion: lugarReunion,
      excusados, texto_legal: textoLegal,
    };
    if (isCAE) {
      datosExtra.mes_reunion = mesReunion;
      datosExtra.texto_punto1 = textoPunto1;
      datosExtra.texto_punto2 = textoPunto2;
      datosExtra.texto_punto2_bloque2 = textoPunto2Bloque2;
      datosExtra.punto2_doc_preventiva = punto2DocPreventiva;
      datosExtra.punto2_doc_trabajadores = punto2DocTrabajadores;
      datosExtra.punto2_doc_maquinaria = punto2DocMaquinaria;
      datosExtra.punto2_doc_trabajos = punto2DocTrabajos;
      datosExtra.punto2_no_procede = punto2NoProcede;
      datosExtra.punto2_otros = punto2Otros;
      datosExtra.riesgos = riesgos;
      datosExtra.otros_riesgos = otrosRiesgos;
      datosExtra.plataforma_cae = plataformaCAE;
      // New CAE fields
      datosExtra.texto_punto3 = textoPunto3;
      datosExtra.empresas_intervienen = empresasIntervienen;
      datosExtra.duracion_trabajos = duracionTrabajos;
      datosExtra.texto_trabajos_realizar = textoTrabajosRealizar;
      datosExtra.texto_recurso_preventivo = textoRecursoPreventivo;
      datosExtra.texto_acuerdos_generales = textoAcuerdosGenerales;
      datosExtra.texto_punto6 = textoPunto6;
      datosExtra.texto_punto7 = textoPunto7;
      datosExtra.texto_punto8 = textoPunto8;
      datosExtra.texto_punto9 = textoPunto9;
      datosExtra.texto_punto10 = textoPunto10;
      datosExtra.punto10_procede = punto10Procede;
      datosExtra.punto10_texto_procede = punto10TextoProcede;
      datosExtra.interferencias_terceros_aplica = interferenciasTercerosAplica;
      datosExtra.interferencias_terceros_texto = interferenciasTercerosTexto;
      datosExtra.medio_ambiente_aplica = medioAmbienteAplica;
      datosExtra.medio_ambiente_texto = medioAmbienteTexto;
      datosExtra.texto_punto13 = textoPunto13;
      datosExtra.punto13_procede = punto13Procede;
      datosExtra.punto13_texto_procede = punto13TextoProcede;
    }
    if (isSYS) {
      datosExtra.numero_acta = numeroActa;
    }

    onSave({
      titulo: obraActuacion || 'Acta de reunión',
      fecha_documento: fechaHora || null,
      nombre_promotor: promotor,
      datos_extra: datosExtra as unknown as Json,
      ...(obraId ? { obra_id: obraId, tipo } : {}),
      ...(!documento ? {
        _asistentes: localAsistentes,
        _actividades: isCAE ? localActividades : undefined,
        _empresas: isCAE ? localEmpresas : undefined,
      } : {}),
    });
  };

  const asistentes = documento ? dbAsistentes : localAsistentes;
  const actividades = documento ? dbActividades : localActividades;
  const empresas = documento ? dbEmpresas : localEmpresas;

  return (
    <div className="space-y-4">
      {/* Import button — creation mode only */}
      {!documento && effectiveObraId && (
        <ImportarVisitaButton obraId={effectiveObraId} onImport={handleImport} />
      )}

      {/* Common fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Obra / Título actuación</Label>
          <Input value={obraActuacion} onChange={e => setObraActuacion(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Localidad y situación</Label>
          <Input value={localidad} onChange={e => setLocalidad(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Promotor</Label>
          <Input value={promotor} onChange={e => setPromotor(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Lugar de reunión</Label>
          <Input value={lugarReunion} onChange={e => setLugarReunion(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Fecha y hora</Label>
          <Input type="datetime-local" value={fechaHora} onChange={e => setFechaHora(e.target.value)} />
        </div>
        {isCAE && (
          <div className="space-y-2">
            <Label>Mes de la reunión</Label>
            <Input value={mesReunion} onChange={e => setMesReunion(e.target.value)} placeholder="Ej: Enero 2025" />
          </div>
        )}
        {isSYS && (
          <div className="space-y-2">
            <Label>Número de acta</Label>
            <Input value={numeroActa} onChange={e => setNumeroActa(e.target.value)} placeholder="Nº correlativo" />
          </div>
        )}
      </div>

      {/* Asistentes */}
      <div className="space-y-3 pt-2">
        <p className="text-sm font-semibold">Asistentes</p>
        {asistentes.map((a: any, i: number) => (
          <div key={a.id || i} className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="text-sm">
              <span className="font-medium">{a.nombre} {a.apellidos}</span>
              {a.cargo && <span className="text-muted-foreground"> · {a.cargo}</span>}
              {a.empresa && <span className="text-muted-foreground"> · {a.empresa}</span>}
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleDeleteAsistente(documento ? a.id : i)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <div className="grid grid-cols-6 gap-2">
          <Input placeholder="Nombre" value={nuevoAsistente.nombre} onChange={e => setNuevoAsistente(p => ({ ...p, nombre: e.target.value }))} />
          <Input placeholder="Apellidos" value={nuevoAsistente.apellidos} onChange={e => setNuevoAsistente(p => ({ ...p, apellidos: e.target.value }))} />
          <Input placeholder="Cargo" value={nuevoAsistente.cargo} onChange={e => setNuevoAsistente(p => ({ ...p, cargo: e.target.value }))} />
          <Input placeholder="Empresa" value={nuevoAsistente.empresa} onChange={e => setNuevoAsistente(p => ({ ...p, empresa: e.target.value }))} />
          <Input placeholder="DNI/NIE" value={nuevoAsistente.dni_nie} onChange={e => setNuevoAsistente(p => ({ ...p, dni_nie: e.target.value }))} />
          <Button size="sm" onClick={handleAddAsistente} disabled={!nuevoAsistente.nombre.trim()} className="gap-1"><Plus className="h-4 w-4" /> Añadir</Button>
        </div>
      </div>

      {/* Excusados */}
      <div className="space-y-2">
        <Label>Excusados / Ausentes</Label>
        <Textarea value={excusados} onChange={e => setExcusados(e.target.value)} rows={2} />
      </div>


      {/* ===== NEW CAE SECTIONS ===== */}
      {isCAE && (
        <div className="space-y-4 pt-4">
          <p className="text-base font-bold text-primary">Secciones ampliadas del Acta CAE</p>

          {/* 1. Objetivo, alcance y ámbito de actuación */}
          <SectionCollapsible title="1. Objetivo, alcance y ámbito de actuación" defaultOpen>
            <div className="space-y-3">
              <div>
                <Label>Texto del punto 1</Label>
                <RichTextEditor value={textoPunto1} onChange={setTextoPunto1} placeholder="En cumplimiento del RD 171/2004..." />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold">Actividades a desarrollar</p>
                {actividades.map((a: any, i: number) => (
                  <div key={a.id || i} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="text-sm">
                      <span className="font-medium">{a.actividad}</span>
                      {a.numero_pedido && <span className="text-muted-foreground"> · Pedido: {a.numero_pedido}</span>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteActividad(documento ? a.id : i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Actividad" value={nuevaActividad.actividad} onChange={e => setNuevaActividad(p => ({ ...p, actividad: e.target.value }))} />
                  <Input placeholder="Nº pedido" value={nuevaActividad.numero_pedido} onChange={e => setNuevaActividad(p => ({ ...p, numero_pedido: e.target.value }))} />
                  <Button size="sm" onClick={handleAddActividad} disabled={!nuevaActividad.actividad.trim()} className="gap-1"><Plus className="h-4 w-4" /> Añadir</Button>
                </div>
              </div>
            </div>
          </SectionCollapsible>

          {/* 2. Intercambio de documentación */}
          <SectionCollapsible title="2. Intercambio de documentación">
            <div className="space-y-4">
              <div>
                <Label>Texto legal del punto 2</Label>
                <RichTextEditor value={textoPunto2} onChange={setTextoPunto2} placeholder="Texto sobre intercambio de documentación..." />
              </div>

              {/* Empresas con acceso a obra */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">Empresas con acceso a obra</p>
                {empresas.map((e: any, i: number) => (
                  <div key={e.id || i} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="text-sm">
                      <span className="font-medium">{e.empresa}</span>
                      {e.persona_contacto && <span className="text-muted-foreground"> · {e.persona_contacto}</span>}
                      {e.email_referencia && <span className="text-muted-foreground"> · {e.email_referencia}</span>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteEmpresa(documento ? e.id : i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="grid grid-cols-4 gap-2">
                  <Input placeholder="Empresa" value={nuevaEmpresa.empresa} onChange={e => setNuevaEmpresa(p => ({ ...p, empresa: e.target.value }))} />
                  <Input placeholder="Contacto" value={nuevaEmpresa.persona_contacto} onChange={e => setNuevaEmpresa(p => ({ ...p, persona_contacto: e.target.value }))} />
                  <Input placeholder="Email" value={nuevaEmpresa.email_referencia} onChange={e => setNuevaEmpresa(p => ({ ...p, email_referencia: e.target.value }))} />
                  <Button size="sm" onClick={handleAddEmpresa} disabled={!nuevaEmpresa.empresa.trim()} className="gap-1"><Plus className="h-4 w-4" /> Añadir</Button>
                </div>
              </div>

              {/* Checkboxes de documentación requerida */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">Documentación requerida</p>
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox checked={punto2DocPreventiva} onCheckedChange={(v) => setPunto2DocPreventiva(!!v)} className="mt-0.5" />
                  La documentación completa en materia preventiva y administrativa de Empresa y Trabajadores
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox checked={punto2DocTrabajadores} onCheckedChange={(v) => setPunto2DocTrabajadores(!!v)} className="mt-0.5" />
                  La relación nominal completa de trabajadores (Nombre, Apellidos, N.I.F. ó Pasaporte o N.I.E.)
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox checked={punto2DocMaquinaria} onCheckedChange={(v) => setPunto2DocMaquinaria(!!v)} className="mt-0.5" />
                  La relación completa de maquinaria, medios auxiliares y/o productos químicos, si procede
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox checked={punto2DocTrabajos} onCheckedChange={(v) => setPunto2DocTrabajos(!!v)} className="mt-0.5" />
                  La relación de los trabajos a realizar (tipología o zona de afectación)
                </label>
              </div>

              {/* Segundo bloque de texto legal */}
              <div>
                <Label>Compromisos documentales (bloque 2)</Label>
                <RichTextEditor value={textoPunto2Bloque2} onChange={setTextoPunto2Bloque2} placeholder="Plazos de entrega, planificación semanal, comunicación entre empresas..." />
              </div>

              {/* No procede / Otros */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={punto2NoProcede} onCheckedChange={(v) => setPunto2NoProcede(!!v)} />
                  No procede
                </label>
                <div className="space-y-1">
                  <Label>Otros</Label>
                  <Input value={punto2Otros} onChange={e => setPunto2Otros(e.target.value)} placeholder="Especificar..." />
                </div>
              </div>

            </div>
          </SectionCollapsible>

          {/* 3. Trabajos Realizados y Previstos */}
          <SectionCollapsible title="3 — Trabajos Realizados y Previstos">
            <div className="space-y-4">
              <div>
                <Label>Texto introductorio del punto 3</Label>
                <RichTextEditor value={textoPunto3} onChange={setTextoPunto3} placeholder="Los trabajos planificados a continuación son tratados desde el punto de vista del RD 171/04..." />
              </div>

              {/* Riesgos previstos */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">Riesgos previstos</p>
                <div className="grid grid-cols-3 gap-3">
                  {RIESGOS_OPTIONS.map(r => (
                    <label key={r} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={riesgos.includes(r)} onCheckedChange={() => toggleRiesgo(r)} />
                      {r}
                    </label>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Otros riesgos</Label>
                  <Input value={otrosRiesgos} onChange={e => setOtrosRiesgos(e.target.value)} placeholder="Especificar..." />
                </div>
                <div className="space-y-2">
                  <Label>Plataforma CAE</Label>
                  <Input value={plataformaCAE} onChange={e => setPlataformaCAE(e.target.value)} />
                </div>
              </div>

              {/* 3.1 Empresas que intervienen */}
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-sm font-semibold">3.1 — Empresas que intervienen en la obra</p>
                {empresasIntervienen.map((e, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="text-sm">
                      <span className="font-medium">{e.razon_social}</span>
                      {e.acronimo && <span className="text-muted-foreground"> ({e.acronimo})</span>}
                      {e.responsable && <span className="text-muted-foreground"> · {e.responsable}</span>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setEmpresasIntervienen(prev => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="grid grid-cols-4 gap-2">
                  <Input placeholder="Razón social" value={nuevaEmpresaInterviene.razon_social} onChange={e => setNuevaEmpresaInterviene(p => ({ ...p, razon_social: e.target.value }))} />
                  <Input placeholder="Acrónimo" value={nuevaEmpresaInterviene.acronimo} onChange={e => setNuevaEmpresaInterviene(p => ({ ...p, acronimo: e.target.value }))} />
                  <Input placeholder="Persona responsable" value={nuevaEmpresaInterviene.responsable} onChange={e => setNuevaEmpresaInterviene(p => ({ ...p, responsable: e.target.value }))} />
                  <Button size="sm" onClick={handleAddEmpresaInterviene} disabled={!nuevaEmpresaInterviene.razon_social.trim()} className="gap-1"><Plus className="h-4 w-4" /> Añadir</Button>
                </div>
              </div>

              {/* 3.2 Duración y ubicación de trabajos */}
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-sm font-semibold">3.2 — Duración y ubicación de los trabajos</p>
                {duracionTrabajos.map((d, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="text-sm">
                      <span className="font-medium">{d.titulo}</span>
                      <span className="text-muted-foreground"> · {d.inicio} — {d.fin}</span>
                      {d.observaciones && <span className="text-muted-foreground"> · {d.observaciones}</span>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setDuracionTrabajos(prev => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="grid grid-cols-5 gap-2">
                  <Input placeholder="Título trabajo" value={nuevaDuracion.titulo} onChange={e => setNuevaDuracion(p => ({ ...p, titulo: e.target.value }))} />
                  <Input placeholder="Inicio" value={nuevaDuracion.inicio} onChange={e => setNuevaDuracion(p => ({ ...p, inicio: e.target.value }))} />
                  <Input placeholder="Fin" value={nuevaDuracion.fin} onChange={e => setNuevaDuracion(p => ({ ...p, fin: e.target.value }))} />
                  <Input placeholder="Observaciones" value={nuevaDuracion.observaciones} onChange={e => setNuevaDuracion(p => ({ ...p, observaciones: e.target.value }))} />
                  <Button size="sm" onClick={handleAddDuracion} disabled={!nuevaDuracion.titulo.trim()} className="gap-1"><Plus className="h-4 w-4" /> Añadir</Button>
                </div>
              </div>

              {/* 3.3 Trabajos a realizar */}
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-sm font-semibold">3.3 — Trabajos a realizar (descripción)</p>
                <RichTextEditor
                  value={textoTrabajosRealizar}
                  onChange={setTextoTrabajosRealizar}
                  placeholder="Descripción de los trabajos a realizar..."
                />
              </div>
            </div>
          </SectionCollapsible>

          {/* 4. Recurso preventivo */}
          <SectionCollapsible title="4 — Recurso preventivo">
            <RichTextEditor
              value={textoRecursoPreventivo}
              onChange={setTextoRecursoPreventivo}
              placeholder="Indicar recurso preventivo designado, funciones, etc."
            />
          </SectionCollapsible>

          {/* 5. Acuerdos Generales */}
          <SectionCollapsible title="5 — Acuerdos Generales">
            <RichTextEditor
              value={textoAcuerdosGenerales}
              onChange={setTextoAcuerdosGenerales}
              placeholder="Texto sobre acuerdos generales adoptados..."
            />
          </SectionCollapsible>

          {/* 6. Formación e Información */}
          <SectionCollapsible title="6 — Formación e Información">
            <RichTextEditor
              value={textoPunto6}
              onChange={setTextoPunto6}
              placeholder="Texto sobre formación e información..."
            />
          </SectionCollapsible>

          {/* 7. Control de maquinaria */}
          <SectionCollapsible title="7 — Control de maquinaria">
            <RichTextEditor
              value={textoPunto7}
              onChange={setTextoPunto7}
              placeholder="Texto sobre control de maquinaria..."
            />
          </SectionCollapsible>

          {/* 8. Protecciones Colectivas y Medios Auxiliares */}
          <SectionCollapsible title="8 — Protecciones Colectivas y Medios Auxiliares">
            <RichTextEditor
              value={textoPunto8}
              onChange={setTextoPunto8}
              placeholder="Texto sobre protecciones colectivas y medios auxiliares..."
            />
          </SectionCollapsible>

          {/* 9. Protecciones Individuales */}
          <SectionCollapsible title="9 — Protecciones Individuales">
            <RichTextEditor
              value={textoPunto9}
              onChange={setTextoPunto9}
              placeholder="Texto sobre protecciones individuales..."
            />
          </SectionCollapsible>

          {/* 10. Interferencias entre empresas */}
          <SectionCollapsible title="10 — Interferencias entre empresas">
            <RichTextEditor
              value={textoPunto10}
              onChange={setTextoPunto10}
              placeholder="Texto legal sobre interferencias entre empresas..."
            />
            <div className="space-y-2 pt-2">
              <Label className="text-sm font-medium">¿Procede?</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={punto10Procede === 'no_procede' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPunto10Procede('no_procede')}
                >
                  NO PROCEDE
                </Button>
                <Button
                  type="button"
                  variant={punto10Procede === 'si_procede' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPunto10Procede('si_procede')}
                >
                  SÍ PROCEDE
                </Button>
              </div>
            </div>
            {punto10Procede === 'si_procede' && (
              <div className="rounded-lg border-2 border-green-300 bg-green-50 p-3 space-y-2">
                <Label className="text-sm font-medium text-green-800">Medidas a aplicar</Label>
                <RichTextEditor
                  value={punto10TextoProcede}
                  onChange={setPunto10TextoProcede}
                  placeholder="Describir las medidas para evitar interferencias..."
                />
              </div>
            )}
          </SectionCollapsible>

          {/* 11. Interferencias con terceros */}
          <SectionCollapsible title="11 — Interferencias con terceros">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={interferenciasTercerosAplica} onCheckedChange={(v) => setInterferenciasTercerosAplica(!!v)} />
              ¿Se detectan interferencias con terceros?
            </label>
            {interferenciasTercerosAplica && (
              <Textarea value={interferenciasTercerosTexto} onChange={e => setInterferenciasTercerosTexto(e.target.value)} rows={3} placeholder="Describir las interferencias con terceros..." />
            )}
          </SectionCollapsible>

          {/* 12. Medio ambiente */}
          <SectionCollapsible title="12 — Medio ambiente">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={medioAmbienteAplica} onCheckedChange={(v) => setMedioAmbienteAplica(!!v)} />
              ¿Aplica consideración medioambiental?
            </label>
            {medioAmbienteAplica && (
              <Textarea value={medioAmbienteTexto} onChange={e => setMedioAmbienteTexto(e.target.value)} rows={3} placeholder="Descripción de las consideraciones medioambientales..." />
            )}
          </SectionCollapsible>

          {/* 13. Ruegos y sugerencias */}
          <SectionCollapsible title="13 — Ruegos y sugerencias">
            <RichTextEditor
              value={textoPunto13}
              onChange={setTextoPunto13}
              placeholder="Los asistentes comunican su total intención de realizar las tareas..."
            />
            <div className="space-y-2">
              <Label className="text-sm font-medium">¿Procede?</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={punto13Procede === 'no_procede' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPunto13Procede('no_procede')}
                >
                  NO PROCEDE
                </Button>
                <Button
                  type="button"
                  variant={punto13Procede === 'si_procede' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPunto13Procede('si_procede')}
                >
                  SÍ PROCEDE
                </Button>
              </div>
            </div>
            {punto13Procede === 'si_procede' && (
              <div className="rounded-lg border-2 border-green-300 bg-green-50 p-3 space-y-2">
                <Label className="text-sm font-medium text-green-800">Indicaciones</Label>
                <RichTextEditor
                  value={punto13TextoProcede}
                  onChange={setPunto13TextoProcede}
                  placeholder="Se les recuerda en cada visita semanal al centro de trabajo..."
                />
              </div>
            )}
          </SectionCollapsible>
        </div>
      )}

      {/* Texto legal editable */}
      <div className="space-y-2 pt-2">
        <Label>Texto legal / Contenido del acta</Label>
        <RichTextEditor
          value={textoLegal}
          onChange={setTextoLegal}
          placeholder="Texto legal que aparecerá en el documento generado. Se precarga desde la configuración de empresa..."
        />
        <p className="text-xs text-muted-foreground">Este texto se incluirá en el PDF generado y puede editarse libremente antes de guardar.</p>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} disabled={saving} className="h-12 rounded-xl">
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}
