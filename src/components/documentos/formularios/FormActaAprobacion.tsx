import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Button } from '@/components/ui/button';
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

export default function FormActaAprobacion({ documento, obraId, tipo, onSave, saving, defaultValues }: Props) {
  const tipoActual = documento?.tipo || tipo || '';
  const isDGPO = tipoActual === 'acta_aprobacion_dgpo';

  const [actuacion, setActuacion] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [promotor, setPromotor] = useState('');
  const [autorProyecto, setAutorProyecto] = useState('');
  const [coordSSProyecto, setCoordSSProyecto] = useState('');
  const [autorEstudioSS, setAutorEstudioSS] = useState('');
  const [directorObra, setDirectorObra] = useState('');
  const [lugarFirma, setLugarFirma] = useState('Maspalomas');
  const [fechaDocumento, setFechaDocumento] = useState('');
  const [textoLegal, setTextoLegal] = useState('');

  // Firma digital
  const { firmaUrl: firmaPerfilUrl } = useFirmaPerfilUrl();
  const [firmaActualUrl, setFirmaActualUrl] = useState<string | null>(null);
  const [firmaPayload, setFirmaPayload] = useState<{ useStored: true } | { blob: Blob } | null>(null);

  // DGPO specific
  const [coordActividadesEmpresariales, setCoordActividadesEmpresariales] = useState('');
  const [empresaContratistaDGPO, setEmpresaContratistaDGPO] = useState('');

  // Plan SYS specific
  const [coordSSObra, setCoordSSObra] = useState('');
  const [empresaContratistaPlan, setEmpresaContratistaPlan] = useState('');

  // Load default legal text from company config for new documents
  useEffect(() => {
    if (!documento) {
      const field = isDGPO ? 'texto_acta_aprobacion_dgpo' : 'texto_acta_aprobacion_sys';
      supabase.from('configuracion_empresa').select(field).limit(1).single().then(({ data }) => {
        if (data && (data as any)[field] && !textoLegal) {
          setTextoLegal((data as any)[field]);
        }
      });
    }
  }, [documento, isDGPO]);

  useEffect(() => {
    if (documento) {
      const extra = (documento.datos_extra as Record<string, any>) || {};
      setActuacion(extra.actuacion || '');
      setLocalidad(extra.localidad || '');
      setPromotor(documento.nombre_promotor || '');
      setAutorProyecto(extra.autor_proyecto || '');
      setCoordSSProyecto(extra.coord_ss_proyecto || '');
      setAutorEstudioSS(extra.autor_estudio_ss || '');
      setDirectorObra(extra.director_obra || '');
      setLugarFirma(extra.lugar_firma || 'Maspalomas');
      setFechaDocumento(documento.fecha_documento || '');
      setTextoLegal(extra.texto_legal || '');
      setCoordActividadesEmpresariales(extra.coord_actividades_empresariales || '');
      setEmpresaContratistaDGPO(extra.empresa_contratista_dgpo || '');
      setCoordSSObra(extra.coord_ss_obra || '');
      setEmpresaContratistaPlan(extra.empresa_contratista_plan || '');
      setFirmaActualUrl(extra.firma_url || null);
    } else if (defaultValues) {
      setActuacion(defaultValues.nombre_obra || '');
      setLocalidad(defaultValues.direccion_obra || '');
      setPromotor(defaultValues.nombre_promotor || '');
      if (defaultValues.direccion_obra) setLugarFirma(defaultValues.direccion_obra);
    }
  }, [documento, defaultValues]);

  const handleSubmit = async () => {
    // Si hay una nueva firma dibujada, súbela primero
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
      // El usuario quitó la firma
      firmaUrlFinal = null;
      firmaAtFinal = null;
    }

    onSave({
      titulo: actuacion || (isDGPO ? 'Acta aprobación DGPO' : 'Acta aprobación Plan SyS'),
      fecha_documento: fechaDocumento || null,
      nombre_promotor: promotor,
      datos_extra: {
        actuacion, localidad, autor_proyecto: autorProyecto,
        coord_ss_proyecto: coordSSProyecto, autor_estudio_ss: autorEstudioSS,
        director_obra: directorObra, lugar_firma: lugarFirma,
        texto_legal: textoLegal,
        firma_url: firmaUrlFinal,
        firma_at: firmaAtFinal,
        ...(isDGPO
          ? { coord_actividades_empresariales: coordActividadesEmpresariales, empresa_contratista_dgpo: empresaContratistaDGPO }
          : { coord_ss_obra: coordSSObra, empresa_contratista_plan: empresaContratistaPlan }),
      } as unknown as Json,
      ...(obraId ? { obra_id: obraId, tipo } : {}),
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-muted-foreground">Datos de la obra</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Actuación / Obra-Instalación</Label>
          <Input value={actuacion} onChange={e => setActuacion(e.target.value)} placeholder="Nombre de la obra" />
        </div>
        <div className="space-y-2">
          <Label>Localidad y situación</Label>
          <Input value={localidad} onChange={e => setLocalidad(e.target.value)} placeholder="Dirección" />
        </div>
        <div className="space-y-2">
          <Label>Promotor</Label>
          <Input value={promotor} onChange={e => setPromotor(e.target.value)} />
        </div>
      </div>

      <p className="text-sm font-semibold text-muted-foreground pt-2">Agentes del proyecto</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Autor del Proyecto</Label>
          <Input value={autorProyecto} onChange={e => setAutorProyecto(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Coordinador SS durante el Proyecto</Label>
          <Input value={coordSSProyecto} onChange={e => setCoordSSProyecto(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Autor del Estudio SS / Básico</Label>
          <Input value={autorEstudioSS} onChange={e => setAutorEstudioSS(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Director de obra</Label>
          <Input value={directorObra} onChange={e => setDirectorObra(e.target.value)} />
        </div>
      </div>

      {isDGPO ? (
        <>
          <p className="text-sm font-semibold text-muted-foreground pt-2">Campos DGPO</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Coordinadora de actividades empresariales</Label>
              <Input value={coordActividadesEmpresariales} onChange={e => setCoordActividadesEmpresariales(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Empresa Contratista Titular</Label>
              <Input value={empresaContratistaDGPO} onChange={e => setEmpresaContratistaDGPO(e.target.value)} />
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-muted-foreground pt-2">Campos Plan SyS</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Coordinador SS durante la Obra</Label>
              <Input value={coordSSObra} onChange={e => setCoordSSObra(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Empresa Contratista Titular del Plan</Label>
              <Input value={empresaContratistaPlan} onChange={e => setEmpresaContratistaPlan(e.target.value)} />
            </div>
          </div>
        </>
      )}

      {/* Texto legal editable */}
      <p className="text-sm font-semibold text-muted-foreground pt-2">Texto legal del acta</p>
      <div className="space-y-2">
        <Label>{isDGPO ? 'Texto legal DGPO' : 'Texto legal Plan de Seguridad y Salud'}</Label>
        <RichTextEditor
          value={textoLegal}
          onChange={setTextoLegal}
          placeholder="Texto legal que aparecerá en el acta de aprobación..."
        />
      </div>

      <p className="text-sm font-semibold text-muted-foreground pt-2">Lugar y fecha del documento</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Lugar de la firma</Label>
          <Input value={lugarFirma} onChange={e => setLugarFirma(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Fecha del documento</Label>
          <Input type="date" value={fechaDocumento} onChange={e => setFechaDocumento(e.target.value)} />
        </div>
      </div>

      <p className="text-sm font-semibold text-muted-foreground pt-2">Firma digital</p>
      <FirmaSelector
        firmaPerfilUrl={firmaPerfilUrl}
        firmaActualUrl={firmaActualUrl}
        onChange={(payload, preview) => {
          setFirmaPayload(payload);
          setFirmaActualUrl(preview);
        }}
      />

      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} disabled={saving} className="h-12 rounded-xl">
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}
