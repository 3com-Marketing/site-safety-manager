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
  const [riesgos, setRiesgos] = useState<string[]>([]);
  const [otrosRiesgos, setOtrosRiesgos] = useState('');
  const [plataformaCAE, setPlataformaCAE] = useState('metacontratas');

  // SYS specific
  const [numeroActa, setNumeroActa] = useState('');

  // NEW CAE fields (sections 3.1, 3.2, 3.3, 4, 10-13)
  const [empresasIntervienen, setEmpresasIntervienen] = useState<Array<{ razon_social: string; acronimo: string; responsable: string }>>([]);
  const [duracionTrabajos, setDuracionTrabajos] = useState<Array<{ titulo: string; inicio: string; fin: string; observaciones: string }>>([]);
  const [textoTrabajosRealizar, setTextoTrabajosRealizar] = useState('');
  const [textoRecursoPreventivo, setTextoRecursoPreventivo] = useState('');
  const [interferenciasEmpresasAplica, setInterferenciasEmpresasAplica] = useState(false);
  const [interferenciasEmpresasTexto, setInterferenciasEmpresasTexto] = useState('');
  const [interferenciasTercerosAplica, setInterferenciasTercerosAplica] = useState(false);
  const [interferenciasTercerosTexto, setInterferenciasTercerosTexto] = useState('');
  const [medioAmbienteAplica, setMedioAmbienteAplica] = useState(false);
  const [medioAmbienteTexto, setMedioAmbienteTexto] = useState('');
  const [ruegosAplica, setRuegosAplica] = useState(false);
  const [ruegosTexto, setRuegosTexto] = useState('');

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
      if (configField) {
        supabase.from('configuracion_empresa').select(configField).limit(1).single().then(({ data }) => {
          if (data && (data as any)[configField]) {
            setTextoLegal((data as any)[configField]);
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
      setRiesgos(extra.riesgos || []);
      setOtrosRiesgos(extra.otros_riesgos || '');
      setPlataformaCAE(extra.plataforma_cae || 'metacontratas');
      setNumeroActa(extra.numero_acta || '');
      // New CAE fields
      setEmpresasIntervienen(extra.empresas_intervienen || []);
      setDuracionTrabajos(extra.duracion_trabajos || []);
      setTextoTrabajosRealizar(extra.texto_trabajos_realizar || '');
      setTextoRecursoPreventivo(extra.texto_recurso_preventivo || '');
      setInterferenciasEmpresasAplica(extra.interferencias_empresas_aplica || false);
      setInterferenciasEmpresasTexto(extra.interferencias_empresas_texto || '');
      setInterferenciasTercerosAplica(extra.interferencias_terceros_aplica || false);
      setInterferenciasTercerosTexto(extra.interferencias_terceros_texto || '');
      setMedioAmbienteAplica(extra.medio_ambiente_aplica || false);
      setMedioAmbienteTexto(extra.medio_ambiente_texto || '');
      setRuegosAplica(extra.ruegos_aplica || false);
      setRuegosTexto(extra.ruegos_texto || '');
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
      datosExtra.riesgos = riesgos;
      datosExtra.otros_riesgos = otrosRiesgos;
      datosExtra.plataforma_cae = plataformaCAE;
      // New CAE fields
      datosExtra.empresas_intervienen = empresasIntervienen;
      datosExtra.duracion_trabajos = duracionTrabajos;
      datosExtra.texto_trabajos_realizar = textoTrabajosRealizar;
      datosExtra.texto_recurso_preventivo = textoRecursoPreventivo;
      datosExtra.interferencias_empresas_aplica = interferenciasEmpresasAplica;
      datosExtra.interferencias_empresas_texto = interferenciasEmpresasTexto;
      datosExtra.interferencias_terceros_aplica = interferenciasTercerosAplica;
      datosExtra.interferencias_terceros_texto = interferenciasTercerosTexto;
      datosExtra.medio_ambiente_aplica = medioAmbienteAplica;
      datosExtra.medio_ambiente_texto = medioAmbienteTexto;
      datosExtra.ruegos_aplica = ruegosAplica;
      datosExtra.ruegos_texto = ruegosTexto;
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

      {/* CAE: Actividades */}
      {isCAE && (
        <div className="space-y-3 pt-2">
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
      )}

      {/* CAE: Empresas acceso */}
      {isCAE && (
        <div className="space-y-3 pt-2">
          <p className="text-sm font-semibold">Empresas con acceso a obra</p>
          {empresas.map((e: any, i: number) => (
            <div key={e.id || i} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="text-sm">
                <span className="font-medium">{e.empresa}</span>
                {e.persona_contacto && <span className="text-muted-foreground"> · {e.persona_contacto}</span>}
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
      )}

      {/* CAE: Riesgos */}
      {isCAE && (
        <div className="space-y-3 pt-2">
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
      )}

      {/* ===== NEW CAE SECTIONS ===== */}
      {isCAE && (
        <div className="space-y-4 pt-4">
          <p className="text-base font-bold text-primary">Secciones ampliadas del Acta CAE</p>

          {/* 3.1 Empresas que intervienen */}
          <SectionCollapsible title="3.1 — Empresas que intervienen en la obra">
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
          </SectionCollapsible>

          {/* 3.2 Duración y ubicación de trabajos */}
          <SectionCollapsible title="3.2 — Duración y ubicación de los trabajos">
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
          </SectionCollapsible>

          {/* 3.3 Trabajos a realizar */}
          <SectionCollapsible title="3.3 — Trabajos a realizar (descripción)">
            <RichTextEditor
              value={textoTrabajosRealizar}
              onChange={setTextoTrabajosRealizar}
              placeholder="Descripción de los trabajos a realizar..."
            />
          </SectionCollapsible>

          {/* 4. Recurso preventivo */}
          <SectionCollapsible title="4 — Recurso preventivo">
            <RichTextEditor
              value={textoRecursoPreventivo}
              onChange={setTextoRecursoPreventivo}
              placeholder="Indicar recurso preventivo designado, funciones, etc."
            />
          </SectionCollapsible>

          {/* 10. Interferencias entre empresas */}
          <SectionCollapsible title="10 — Interferencias entre empresas">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={interferenciasEmpresasAplica} onCheckedChange={(v) => setInterferenciasEmpresasAplica(!!v)} />
              ¿Se detectan interferencias entre empresas?
            </label>
            {interferenciasEmpresasAplica && (
              <Textarea value={interferenciasEmpresasTexto} onChange={e => setInterferenciasEmpresasTexto(e.target.value)} rows={3} placeholder="Describir las interferencias detectadas..." />
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
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={ruegosAplica} onCheckedChange={(v) => setRuegosAplica(!!v)} />
              ¿Hay ruegos o sugerencias?
            </label>
            {ruegosAplica && (
              <Textarea value={ruegosTexto} onChange={e => setRuegosTexto(e.target.value)} rows={3} placeholder="Indicar ruegos y sugerencias..." />
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
