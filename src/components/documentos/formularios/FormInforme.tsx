import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Button } from '@/components/ui/button';
import ImportarVisitaButton, { type VisitaImportData } from '@/components/documentos/ImportarVisitaButton';
import { supabase } from '@/integrations/supabase/client';
import type { Documento } from '@/hooks/useDocumentosObra';
import type { Json } from '@/integrations/supabase/types';

interface Props {
  documento?: Documento | null;
  obraId?: string;
  tipo?: string;
  onSave: (data: Record<string, any>) => Promise<void>;
  saving?: boolean;
  defaultValues?: Record<string, string>;
}

const SECCIONES = [
  { key: 'estado_general', label: 'Estado general de la obra' },
  { key: 'orden_limpieza', label: 'Orden y limpieza' },
  { key: 'senalizacion', label: 'Señalización y balizamiento' },
  { key: 'trabajos_altura', label: 'Trabajos en altura' },
  { key: 'epc', label: 'Equipos de protección colectiva' },
  { key: 'epi', label: 'Equipos de protección individual' },
  { key: 'maquinaria', label: 'Maquinaria' },
  { key: 'medios_auxiliares', label: 'Medios auxiliares' },
];

const CATEGORY_MAP: Record<string, string> = {
  'EPIs': 'epi',
  'orden_limpieza': 'orden_limpieza',
  'altura': 'trabajos_altura',
  'señalizacion': 'senalizacion',
  'maquinaria': 'maquinaria',
};

export default function FormInforme({ documento, obraId, tipo, onSave, saving, defaultValues }: Props) {
  const [fechaVisita, setFechaVisita] = useState('');
  const [tituloObra, setTituloObra] = useState('');
  const [nombreTecnico, setNombreTecnico] = useState('');
  const [empresaContratista, setEmpresaContratista] = useState('');
  const [secciones, setSecciones] = useState<Record<string, string>>(
    Object.fromEntries(SECCIONES.map(s => [s.key, '']))
  );
  const [recomendaciones, setRecomendaciones] = useState('');
  const [normativa, setNormativa] = useState('');

  const effectiveObraId = obraId || documento?.obra_id || '';
  const effectiveTipo = tipo || documento?.tipo || '';
  const isAT = effectiveTipo === 'informe_at';

  const configLoaded = useRef(false);

  // Load defaults from company config for new documents
  useEffect(() => {
    if (documento || configLoaded.current) return;
    configLoaded.current = true;
    supabase.from('configuracion_empresa').select('texto_recomendaciones, texto_normativa').limit(1).single().then(({ data }) => {
      if (data) {
        if (data.texto_recomendaciones) setRecomendaciones(data.texto_recomendaciones);
        if (data.texto_normativa) setNormativa(data.texto_normativa);
      }
    });
  }, [documento]);

  useEffect(() => {
    if (documento) {
      const extra = (documento.datos_extra as Record<string, any>) || {};
      setFechaVisita(documento.fecha_documento || '');
      setTituloObra(extra.titulo_obra || '');
      setNombreTecnico(extra.nombre_tecnico || '');
      setEmpresaContratista(extra.empresa_contratista || '');
      setRecomendaciones(extra.recomendaciones || '');
      setNormativa(extra.normativa || '');
      const sec: Record<string, string> = {};
      SECCIONES.forEach(s => { sec[s.key] = extra[s.key] || ''; });
      setSecciones(sec);
    } else if (defaultValues) {
      setTituloObra(defaultValues.nombre_obra || '');
      setNombreTecnico(defaultValues.nombre_tecnico || '');
    }
  }, [documento, defaultValues]);

  const handleImport = (data: VisitaImportData) => {
    const newSections = { ...secciones };
    if (data.informe.notas_generales) {
      newSections.estado_general = data.informe.notas_generales;
    }
    for (const bloque of data.bloques) {
      const sectionKey = CATEGORY_MAP[bloque.categoria];
      if (!sectionKey) continue;
      const parts: string[] = [];
      if (bloque.estado && bloque.estado !== 'pendiente') {
        parts.push(`Estado: ${bloque.estado}`);
      }
      for (const a of bloque.anotaciones) {
        if (a.texto) parts.push(a.texto);
      }
      if (parts.length) {
        newSections[sectionKey] = parts.join('\n');
      }
    }
    setSecciones(newSections);
  };

  const handleSubmit = () => {
    onSave({
      titulo: tituloObra || (effectiveTipo === 'informe_css' ? 'Informe CSS' : 'Informe AT'),
      fecha_documento: fechaVisita || null,
      datos_extra: {
        titulo_obra: tituloObra,
        nombre_tecnico: nombreTecnico,
        empresa_contratista: empresaContratista,
        recomendaciones,
        normativa,
        ...secciones,
      } as unknown as Json,
      ...(obraId ? { obra_id: obraId, tipo } : {}),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha de visita</Label>
          <Input type="date" value={fechaVisita} onChange={e => setFechaVisita(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Título de la obra</Label>
          <Input value={tituloObra} onChange={e => setTituloObra(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Nombre del técnico</Label>
          <Input value={nombreTecnico} onChange={e => setNombreTecnico(e.target.value)} />
        </div>
        {isAT && (
          <div className="space-y-2">
            <Label>Empresa contratista</Label>
            <Input value={empresaContratista} onChange={e => setEmpresaContratista(e.target.value)} />
          </div>
        )}
      </div>

      {!documento && effectiveObraId && (
        <ImportarVisitaButton obraId={effectiveObraId} onImport={handleImport} />
      )}

      {/* Recomendaciones (texto legal) */}
      <div className="space-y-2">
        <Label>2. Recomendaciones (texto legal)</Label>
        <RichTextEditor
          value={recomendaciones}
          onChange={setRecomendaciones}
          placeholder="Texto de recomendaciones legales que aparecerá en el informe..."
        />
      </div>

      {SECCIONES.map((s, i) => (
        <div key={s.key} className="space-y-2">
          <Label>{i + 3}. {s.label}</Label>
          <Textarea
            value={secciones[s.key]}
            onChange={e => setSecciones(prev => ({ ...prev, [s.key]: e.target.value }))}
            rows={3}
            placeholder={`Observaciones sobre ${s.label.toLowerCase()}...`}
          />
        </div>
      ))}

      {/* Normativa aplicable */}
      <div className="space-y-2">
        <Label>11. Normativa aplicable</Label>
        <RichTextEditor
          value={normativa}
          onChange={setNormativa}
          placeholder="Lista de normativa aplicable..."
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} disabled={saving} className="h-12 rounded-xl">
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}
