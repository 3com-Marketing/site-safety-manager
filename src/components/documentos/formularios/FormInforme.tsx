import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
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

// Map checklist_bloques categories to form section keys
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
  const [secciones, setSecciones] = useState<Record<string, string>>(
    Object.fromEntries(SECCIONES.map(s => [s.key, '']))
  );
  const [recomendaciones, setRecomendaciones] = useState('');
  const [importing, setImporting] = useState(false);

  const effectiveObraId = obraId || documento?.obra_id || '';

  useEffect(() => {
    if (documento) {
      const extra = (documento.datos_extra as Record<string, any>) || {};
      setFechaVisita(documento.fecha_documento || '');
      setTituloObra(extra.titulo_obra || '');
      setNombreTecnico(extra.nombre_tecnico || '');
      setRecomendaciones(extra.recomendaciones || '');
      const sec: Record<string, string> = {};
      SECCIONES.forEach(s => { sec[s.key] = extra[s.key] || ''; });
      setSecciones(sec);
    } else if (defaultValues) {
      setTituloObra(defaultValues.nombre_obra || '');
      setNombreTecnico(defaultValues.nombre_tecnico || '');
    }
  }, [documento, defaultValues]);

  const handleImport = async () => {
    if (!effectiveObraId) return;
    setImporting(true);
    try {
      // Find last finalizada visit for this obra
      const { data: visita, error: visitaError } = await supabase
        .from('visitas')
        .select('id, fecha, fecha_fin')
        .eq('obra_id', effectiveObraId)
        .eq('estado', 'finalizada')
        .order('fecha_fin', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (visitaError) throw visitaError;
      if (!visita) {
        toast.error('No hay visitas finalizadas para esta obra');
        return;
      }

      // Get the informe for that visit
      const { data: informe } = await supabase
        .from('informes')
        .select('id, notas_generales')
        .eq('visita_id', visita.id)
        .limit(1)
        .maybeSingle();

      if (!informe) {
        toast.error('No hay visitas finalizadas para esta obra');
        return;
      }

      // Get checklist_bloques with anotaciones
      const { data: bloques } = await supabase
        .from('checklist_bloques')
        .select('categoria, estado, anotaciones(*)')
        .eq('informe_id', informe.id);

      const newSections = { ...secciones };

      // Map notas_generales to estado_general
      if (informe.notas_generales) {
        newSections.estado_general = informe.notas_generales;
      }

      // Map bloques
      if (bloques) {
        for (const bloque of bloques) {
          const sectionKey = CATEGORY_MAP[bloque.categoria];
          if (!sectionKey) continue;
          const anotaciones = (bloque as any).anotaciones || [];
          const parts: string[] = [];
          if (bloque.estado && bloque.estado !== 'pendiente') {
            parts.push(`Estado: ${bloque.estado}`);
          }
          for (const a of anotaciones) {
            if (a.texto) parts.push(a.texto);
          }
          if (parts.length) {
            newSections[sectionKey] = parts.join('\n');
          }
        }
      }

      setSecciones(newSections);

      const fechaStr = visita.fecha_fin
        ? new Date(visita.fecha_fin).toLocaleDateString('es-ES')
        : new Date(visita.fecha).toLocaleDateString('es-ES');
      toast.success(`Datos importados desde la visita del ${fechaStr}`);
    } catch (err) {
      console.error(err);
      toast.error('Error al importar datos de la visita');
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = () => {
    onSave({
      titulo: tituloObra || (tipo === 'informe_css' ? 'Informe CSS' : 'Informe AT'),
      fecha_documento: fechaVisita || null,
      datos_extra: {
        titulo_obra: tituloObra,
        nombre_tecnico: nombreTecnico,
        recomendaciones,
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
        <div className="col-span-2 space-y-2">
          <Label>Nombre del técnico</Label>
          <Input value={nombreTecnico} onChange={e => setNombreTecnico(e.target.value)} />
        </div>
      </div>

      {/* Import button — always shown on creation when there's an obra */}
      {!documento && effectiveObraId && (
        <Button variant="outline" onClick={handleImport} disabled={importing} className="gap-2">
          <Download className="h-4 w-4" />
          {importing ? 'Importando...' : 'Importar desde última visita'}
        </Button>
      )}

      {/* Secciones */}
      {SECCIONES.map(s => (
        <div key={s.key} className="space-y-2">
          <Label>{s.label}</Label>
          <Textarea
            value={secciones[s.key]}
            onChange={e => setSecciones(prev => ({ ...prev, [s.key]: e.target.value }))}
            rows={3}
            placeholder={`Observaciones sobre ${s.label.toLowerCase()}...`}
          />
        </div>
      ))}

      <div className="space-y-2">
        <Label>Recomendaciones adicionales</Label>
        <Textarea value={recomendaciones} onChange={e => setRecomendaciones(e.target.value)} rows={3} placeholder="Opcional" />
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} disabled={saving} className="h-12 rounded-xl">
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}
