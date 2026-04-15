import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
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

export default function FormInforme({ documento, obraId, tipo, onSave, saving, defaultValues }: Props) {
  const [titulo, setTitulo] = useState('');
  const [fechaDocumento, setFechaDocumento] = useState('');
  const [nombreCoordinador, setNombreCoordinador] = useState('');
  const [dniCoordinador, setDniCoordinador] = useState('');
  const [titulacionColegiado, setTitulacionColegiado] = useState('');
  const [empresaCoordinacion, setEmpresaCoordinacion] = useState('');
  const [nombrePromotor, setNombrePromotor] = useState('');
  const [contenido, setContenido] = useState('');
  const [conclusiones, setConclusiones] = useState('');

  useEffect(() => {
    if (documento) {
      setTitulo(documento.titulo || '');
      setFechaDocumento(documento.fecha_documento || '');
      setNombreCoordinador(documento.nombre_coordinador || '');
      setDniCoordinador(documento.dni_coordinador || '');
      setTitulacionColegiado(documento.titulacion_colegiado || '');
      setEmpresaCoordinacion(documento.empresa_coordinacion || '');
      setNombrePromotor(documento.nombre_promotor || '');
      const extra = (documento.datos_extra as Record<string, any>) || {};
      setContenido(extra.contenido || '');
      setConclusiones(extra.conclusiones || '');
    } else if (defaultValues) {
      setNombreCoordinador(defaultValues.nombre_coordinador || '');
      setEmpresaCoordinacion(defaultValues.empresa_coordinacion || '');
      setNombrePromotor(defaultValues.nombre_promotor || '');
    }
  }, [documento, defaultValues]);

  const handleSubmit = () => {
    onSave({
      titulo, fecha_documento: fechaDocumento || null,
      nombre_coordinador: nombreCoordinador, dni_coordinador: dniCoordinador,
      titulacion_colegiado: titulacionColegiado, empresa_coordinacion: empresaCoordinacion,
      nombre_promotor: nombrePromotor,
      datos_extra: { contenido, conclusiones } as unknown as Json,
      ...(obraId ? { obra_id: obraId, tipo } : {}),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Título</Label>
          <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título del informe" />
        </div>
        <div className="space-y-2">
          <Label>Fecha del documento</Label>
          <Input type="date" value={fechaDocumento} onChange={e => setFechaDocumento(e.target.value)} />
        </div>
      </div>

      <p className="text-sm font-semibold text-muted-foreground pt-2">Coordinador</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input value={nombreCoordinador} onChange={e => setNombreCoordinador(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>DNI</Label>
          <Input value={dniCoordinador} onChange={e => setDniCoordinador(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Titulación / Colegiado</Label>
          <Input value={titulacionColegiado} onChange={e => setTitulacionColegiado(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Empresa</Label>
          <Input value={empresaCoordinacion} onChange={e => setEmpresaCoordinacion(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Promotor</Label>
        <Input value={nombrePromotor} onChange={e => setNombrePromotor(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Contenido del informe</Label>
        <Textarea value={contenido} onChange={e => setContenido(e.target.value)} rows={5} placeholder="Descripción detallada..." />
      </div>

      <div className="space-y-2">
        <Label>Conclusiones</Label>
        <Textarea value={conclusiones} onChange={e => setConclusiones(e.target.value)} rows={3} />
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} disabled={saving} className="h-12 rounded-xl">
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}
