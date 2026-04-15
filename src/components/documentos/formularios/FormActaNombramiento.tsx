import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Documento } from '@/hooks/useDocumentosObra';

interface Props {
  documento?: Documento | null;
  obraId?: string;
  tipo?: string;
  onSave: (data: Record<string, any>) => Promise<void>;
  saving?: boolean;
  defaultValues?: Record<string, string>;
}

export default function FormActaNombramiento({ documento, obraId, tipo, onSave, saving, defaultValues }: Props) {
  const [titulo, setTitulo] = useState('');
  const [fechaDocumento, setFechaDocumento] = useState('');
  const [nombreCoordinador, setNombreCoordinador] = useState('');
  const [dniCoordinador, setDniCoordinador] = useState('');
  const [titulacionColegiado, setTitulacionColegiado] = useState('');
  const [empresaCoordinacion, setEmpresaCoordinacion] = useState('');
  const [cifEmpresa, setCifEmpresa] = useState('');
  const [domicilioEmpresa, setDomicilioEmpresa] = useState('');
  const [movilCoordinador, setMovilCoordinador] = useState('');
  const [emailCoordinador, setEmailCoordinador] = useState('');
  const [nombrePromotor, setNombrePromotor] = useState('');
  const [cifPromotor, setCifPromotor] = useState('');
  const [domicilioPromotor, setDomicilioPromotor] = useState('');

  useEffect(() => {
    if (documento) {
      setTitulo(documento.titulo || '');
      setFechaDocumento(documento.fecha_documento || '');
      setNombreCoordinador(documento.nombre_coordinador || '');
      setDniCoordinador(documento.dni_coordinador || '');
      setTitulacionColegiado(documento.titulacion_colegiado || '');
      setEmpresaCoordinacion(documento.empresa_coordinacion || '');
      setCifEmpresa(documento.cif_empresa || '');
      setDomicilioEmpresa(documento.domicilio_empresa || '');
      setMovilCoordinador(documento.movil_coordinador || '');
      setEmailCoordinador(documento.email_coordinador || '');
      setNombrePromotor(documento.nombre_promotor || '');
      setCifPromotor(documento.cif_promotor || '');
      setDomicilioPromotor(documento.domicilio_promotor || '');
    } else if (defaultValues) {
      setNombreCoordinador(defaultValues.nombre_coordinador || '');
      setEmailCoordinador(defaultValues.email_coordinador || '');
      setMovilCoordinador(defaultValues.movil_coordinador || '');
      setNombrePromotor(defaultValues.nombre_promotor || '');
      setCifPromotor(defaultValues.cif_promotor || '');
      setDomicilioPromotor(defaultValues.domicilio_promotor || '');
    }
  }, [documento, defaultValues]);

  const handleSubmit = () => {
    onSave({
      titulo, fecha_documento: fechaDocumento || null,
      nombre_coordinador: nombreCoordinador, dni_coordinador: dniCoordinador,
      titulacion_colegiado: titulacionColegiado, empresa_coordinacion: empresaCoordinacion,
      cif_empresa: cifEmpresa, domicilio_empresa: domicilioEmpresa,
      movil_coordinador: movilCoordinador, email_coordinador: emailCoordinador,
      nombre_promotor: nombrePromotor, cif_promotor: cifPromotor, domicilio_promotor: domicilioPromotor,
      ...(obraId ? { obra_id: obraId, tipo } : {}),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Título</Label>
          <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título del acta" />
        </div>
        <div className="space-y-2">
          <Label>Fecha del documento</Label>
          <Input type="date" value={fechaDocumento} onChange={e => setFechaDocumento(e.target.value)} />
        </div>
      </div>

      <p className="text-sm font-semibold text-muted-foreground pt-2">Datos del Coordinador</p>
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
          <Label>Empresa de coordinación</Label>
          <Input value={empresaCoordinacion} onChange={e => setEmpresaCoordinacion(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>CIF empresa</Label>
          <Input value={cifEmpresa} onChange={e => setCifEmpresa(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Domicilio empresa</Label>
          <Input value={domicilioEmpresa} onChange={e => setDomicilioEmpresa(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Móvil</Label>
          <Input value={movilCoordinador} onChange={e => setMovilCoordinador(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={emailCoordinador} onChange={e => setEmailCoordinador(e.target.value)} />
        </div>
      </div>

      <p className="text-sm font-semibold text-muted-foreground pt-2">Datos del Promotor</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre promotor</Label>
          <Input value={nombrePromotor} onChange={e => setNombrePromotor(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>CIF promotor</Label>
          <Input value={cifPromotor} onChange={e => setCifPromotor(e.target.value)} />
        </div>
        <div className="col-span-2 space-y-2">
          <Label>Domicilio promotor</Label>
          <Input value={domicilioPromotor} onChange={e => setDomicilioPromotor(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} disabled={saving} className="h-12 rounded-xl">
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}
