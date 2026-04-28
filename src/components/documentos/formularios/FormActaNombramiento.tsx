import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import type { Documento } from '@/hooks/useDocumentosObra';
import type { Json } from '@/integrations/supabase/types';
import FirmaSelector from '@/components/documentos/FirmaSelector';
import { useFirmaPerfilUrl, uploadFirmaDocumento } from '@/components/documentos/useFirmaPerfil';

interface Props {
  documento?: Documento | null;
  obraId?: string;
  tipo?: string;
  onSave: (data: Record<string, any>) => Promise<void>;
  saving?: boolean;
  defaultValues?: Record<string, string>;
}

const TIPO_TO_CONFIG_FIELD: Record<string, string> = {
  acta_nombramiento_cae: 'texto_acta_nombramiento_cae',
  acta_nombramiento_proyecto: 'texto_acta_nombramiento_proyecto',
};

export default function FormActaNombramiento({ documento, obraId, tipo, onSave, saving, defaultValues }: Props) {
  const [denominacion, setDenominacion] = useState('');
  const [emplazamiento, setEmplazamiento] = useState('');
  const [tipoObra, setTipoObra] = useState('');
  const [modalidad, setModalidad] = useState<'cae' | 'proyecto'>('cae');

  const [nombrePromotor, setNombrePromotor] = useState('');
  const [cifPromotor, setCifPromotor] = useState('');
  const [domicilioPromotor, setDomicilioPromotor] = useState('');

  const [nombreCoordinador, setNombreCoordinador] = useState('');
  const [dniCoordinador, setDniCoordinador] = useState('');
  const [titulacionColegiado, setTitulacionColegiado] = useState('');
  const [empresaCoordinacion, setEmpresaCoordinacion] = useState('');
  const [cifEmpresa, setCifEmpresa] = useState('');
  const [domicilioEmpresa, setDomicilioEmpresa] = useState('');
  const [movilCoordinador, setMovilCoordinador] = useState('');
  const [emailCoordinador, setEmailCoordinador] = useState('');

  const [textoLegal, setTextoLegal] = useState('');
  const [lugarFirma, setLugarFirma] = useState('Maspalomas');
  const [fechaDocumento, setFechaDocumento] = useState('');

  // Firma digital
  const { firmaUrl: firmaPerfilUrl } = useFirmaPerfilUrl();
  const [firmaActualUrl, setFirmaActualUrl] = useState<string | null>(null);
  const [firmaPayload, setFirmaPayload] = useState<{ useStored: true } | { blob: Blob } | null>(null);

  // Store the raw template from config so we can re-apply substitutions
  const templateRef = useRef<string | null>(null);

  /** Replace sequential [....] markers with field values */
  const applyPlaceholders = useCallback((template: string, dom: string, coord: string, tit: string) => {
    let i = 0;
    const values = [dom || '____', coord || '____', tit || '____'];
    return template.replace(/\[\.{3,}\]/g, () => {
      const v = values[i] ?? '____';
      i++;
      return v;
    });
  }, []);

  // Load default legal text from config when creating new document
  useEffect(() => {
    if (documento) return;
    const docTipo = tipo || '';
    const configField = TIPO_TO_CONFIG_FIELD[docTipo];
    if (!configField) return;
    supabase.from('configuracion_empresa').select(configField).limit(1).single().then(({ data }) => {
      if (data && (data as any)[configField]) {
        const raw = (data as any)[configField] as string;
        templateRef.current = raw;
        setTextoLegal(applyPlaceholders(raw, domicilioPromotor, nombreCoordinador, titulacionColegiado));
      }
    });
  }, [documento, tipo]);

  // Re-apply placeholders when relevant fields change (only for new docs with a template)
  useEffect(() => {
    if (!templateRef.current || documento) return;
    setTextoLegal(applyPlaceholders(templateRef.current, domicilioPromotor, nombreCoordinador, titulacionColegiado));
  }, [domicilioPromotor, nombreCoordinador, titulacionColegiado, applyPlaceholders]);

  useEffect(() => {
    if (documento) {
      const extra = (documento.datos_extra as Record<string, any>) || {};
      setDenominacion(extra.denominacion || '');
      setEmplazamiento(extra.emplazamiento || '');
      setTipoObra(extra.tipo_obra || '');
      setModalidad(extra.modalidad || 'cae');
      setLugarFirma(extra.lugar_firma || 'Maspalomas');
      setTextoLegal(extra.texto_legal || '');
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
      setFirmaActualUrl(extra.firma_url || null);
    } else if (defaultValues) {
      setDenominacion(defaultValues.nombre_obra || '');
      setEmplazamiento(defaultValues.direccion_obra || '');
      setNombreCoordinador(defaultValues.nombre_coordinador || '');
      setEmailCoordinador(defaultValues.email_coordinador || '');
      setMovilCoordinador(defaultValues.movil_coordinador || '');
      setNombrePromotor(defaultValues.nombre_promotor || '');
      setCifPromotor(defaultValues.cif_promotor || '');
      setDomicilioPromotor(defaultValues.domicilio_promotor || '');
      if (defaultValues.direccion_obra) setLugarFirma(defaultValues.direccion_obra);
    }
  }, [documento, defaultValues]);

  const handleSubmit = async () => {
    let firmaUrlFinal: string | null = firmaActualUrl;
    let firmaAtFinal: string | null = (documento?.datos_extra as any)?.firma_at || null;

    if (firmaPayload && 'blob' in firmaPayload) {
      try {
        const docKey = documento?.id || `nuevo_${Date.now()}`;
        firmaUrlFinal = await uploadFirmaDocumento(docKey, firmaPayload.blob);
        firmaAtFinal = new Date().toISOString();
      } catch (e: any) {
        console.error('Error subiendo firma:', e);
      }
    } else if (firmaPayload && 'useStored' in firmaPayload && firmaPerfilUrl) {
      firmaUrlFinal = firmaPerfilUrl;
      firmaAtFinal = new Date().toISOString();
    } else if (firmaPayload === null && (documento?.datos_extra as any)?.firma_url) {
      firmaUrlFinal = null;
      firmaAtFinal = null;
    }

    onSave({
      titulo: denominacion || 'Acta de nombramiento',
      fecha_documento: fechaDocumento || null,
      nombre_coordinador: nombreCoordinador,
      dni_coordinador: dniCoordinador,
      titulacion_colegiado: titulacionColegiado,
      empresa_coordinacion: empresaCoordinacion,
      cif_empresa: cifEmpresa,
      domicilio_empresa: domicilioEmpresa,
      movil_coordinador: movilCoordinador,
      email_coordinador: emailCoordinador,
      nombre_promotor: nombrePromotor,
      cif_promotor: cifPromotor,
      domicilio_promotor: domicilioPromotor,
      datos_extra: {
        denominacion, emplazamiento, tipo_obra: tipoObra,
        modalidad, lugar_firma: lugarFirma, texto_legal: textoLegal,
        firma_url: firmaUrlFinal,
        firma_at: firmaAtFinal,
      } as unknown as Json,
      ...(obraId ? { obra_id: obraId, tipo } : {}),
    });
  };

  return (
    <div className="space-y-4">
      {/* Modalidad */}
      <div className="space-y-2">
        <Label>Tipo de nombramiento</Label>
        <Select value={modalidad} onValueChange={(v: 'cae' | 'proyecto') => setModalidad(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cae">CAE (obra sin proyecto)</SelectItem>
            <SelectItem value="proyecto">Con proyecto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Datos proyecto */}
      <p className="text-sm font-semibold text-muted-foreground pt-2">Datos del proyecto</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Denominación</Label>
          <Input value={denominacion} onChange={e => setDenominacion(e.target.value)} placeholder="Nombre de la obra" />
        </div>
        <div className="space-y-2">
          <Label>Emplazamiento</Label>
          <Input value={emplazamiento} onChange={e => setEmplazamiento(e.target.value)} placeholder="Dirección" />
        </div>
        <div className="col-span-2 space-y-2">
          <Label>Tipo de obra</Label>
          <Input value={tipoObra} onChange={e => setTipoObra(e.target.value)} placeholder="Ej: Edificación, Reforma..." />
        </div>
      </div>

      {/* Datos promotor */}
      <p className="text-sm font-semibold text-muted-foreground pt-2">Datos del Promotor</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre / Razón Social</Label>
          <Input value={nombrePromotor} onChange={e => setNombrePromotor(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>CIF</Label>
          <Input value={cifPromotor} onChange={e => setCifPromotor(e.target.value)} />
        </div>
        <div className="col-span-2 space-y-2">
          <Label>Domicilio</Label>
          <Input value={domicilioPromotor} onChange={e => setDomicilioPromotor(e.target.value)} />
        </div>
      </div>

      {/* Datos coordinador */}
      <p className="text-sm font-semibold text-muted-foreground pt-2">Datos del Coordinador/a</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre y apellidos</Label>
          <Input value={nombreCoordinador} onChange={e => setNombreCoordinador(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>DNI</Label>
          <Input value={dniCoordinador} onChange={e => setDniCoordinador(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Titulación / Nº Colegiado</Label>
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

      {/* Texto legal */}
      <p className="text-sm font-semibold text-muted-foreground pt-2">Texto legal</p>
      <RichTextEditor
        value={textoLegal}
        onChange={setTextoLegal}
        placeholder="Texto legal del acta de nombramiento..."
      />

      {/* Firma */}
      <p className="text-sm font-semibold text-muted-foreground pt-2">Firma</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Lugar</Label>
          <Input value={lugarFirma} onChange={e => setLugarFirma(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input type="date" value={fechaDocumento} onChange={e => setFechaDocumento(e.target.value)} />
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
