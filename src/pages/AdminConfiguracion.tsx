import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Upload, Loader2, Building2, User, Landmark, CreditCard, FileText, BookOpen } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { toast } from 'sonner';

interface ConfigEmpresa {
  id?: string;
  nombre: string;
  cif: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string;
  web: string;
  logo_url: string;
  nombre_responsable: string;
  cargo_responsable: string;
  titulacion: string;
  num_colegiado: string;
  registro_mercantil: string;
  iban: string;
  banco: string;
  swift_bic: string;
  texto_recomendaciones: string;
  texto_normativa: string;
  texto_acta_aprobacion_sys: string;
  texto_cae_punto2_bloque2: string;
  texto_acta_aprobacion_dgpo: string;
  texto_acta_reunion_inicial: string;
  texto_acta_reunion_cae: string;
  texto_acta_reunion_sys: string;
  texto_acta_nombramiento_cae: string;
  texto_acta_nombramiento_proyecto: string;
  texto_cae_punto1: string;
  texto_cae_punto3: string;
  texto_cae_punto2: string;
  texto_recurso_preventivo: string;
  texto_acuerdos_generales: string;
  texto_cae_punto6: string;
  texto_cae_punto7: string;
  texto_cae_punto8: string;
  texto_cae_punto9: string;
  texto_cae_punto10: string;
  texto_cae_punto10_procede: string;
  texto_cae_punto13: string;
  texto_cae_punto13_procede: string;
}

const EMPTY_CONFIG: ConfigEmpresa = {
  nombre: '', cif: '', direccion: '', ciudad: '', telefono: '',
  email: '', web: '', logo_url: '', nombre_responsable: '',
  cargo_responsable: '', titulacion: '', num_colegiado: '',
  registro_mercantil: '', iban: '', banco: '', swift_bic: '',
  texto_recomendaciones: '', texto_normativa: '', texto_cae_punto2_bloque2: '',
  texto_acta_aprobacion_sys: '', texto_acta_aprobacion_dgpo: '',
  texto_acta_reunion_inicial: '', texto_acta_reunion_cae: '', texto_acta_reunion_sys: '',
  texto_acta_nombramiento_cae: '', texto_acta_nombramiento_proyecto: '',
  texto_cae_punto1: '',
  texto_cae_punto3: '',
  texto_cae_punto2: '',
  texto_recurso_preventivo: '',
  texto_acuerdos_generales: '',
  texto_cae_punto6: '',
  texto_cae_punto7: '',
  texto_cae_punto8: '',
  texto_cae_punto9: '',
  texto_cae_punto10: '',
  texto_cae_punto10_procede: '',
  texto_cae_punto13: '',
  texto_cae_punto13_procede: '',
};

export default function AdminConfiguracion() {
  const [config, setConfig] = useState<ConfigEmpresa>(EMPTY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => {
    supabase.from('configuracion_empresa').select('*').limit(1).single().then(({ data }) => {
      if (data) {
        setConfig(data as any);
        setLogoPreview(data.logo_url || '');
      }
      setLoading(false);
    });
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    let logoUrl = config.logo_url;

    if (logoFile) {
      const ext = logoFile.name.split('.').pop();
      const path = `empresa/logo.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('logos').upload(path, logoFile, { upsert: true });
      if (uploadErr) {
        toast.error('Error al subir el logo');
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path);
      logoUrl = urlData.publicUrl;
    }

    const payload = { ...config, logo_url: logoUrl };
    delete (payload as any).created_at;
    delete (payload as any).updated_at;

    let error;
    if (config.id) {
      const { id, ...updateData } = payload;
      ({ error } = await supabase.from('configuracion_empresa').update(updateData).eq('id', config.id));
    } else {
      const { id, ...insertData } = payload;
      const { data, error: insertErr } = await supabase.from('configuracion_empresa').insert(insertData).select().single();
      error = insertErr;
      if (data) setConfig(data as any);
    }

    if (error) toast.error('Error al guardar');
    else {
      toast.success('Configuración guardada');
      setConfig(prev => ({ ...prev, logo_url: logoUrl }));
      setLogoFile(null);
    }
    setSaving(false);
  };

  const update = (field: keyof ConfigEmpresa, value: string) =>
    setConfig(prev => ({ ...prev, [field]: value }));

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-heading font-bold">Configuración de Empresa</h2>
            <p className="text-sm text-muted-foreground">Datos que aparecerán en los documentos generados</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar
          </Button>
        </div>

        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4" /> Logotipo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="h-20 max-w-[200px] object-contain rounded border p-2 bg-white" />
            ) : (
              <div className="h-20 w-40 rounded border border-dashed flex items-center justify-center text-muted-foreground text-sm">
                Sin logo
              </div>
            )}
            <div>
              <Input type="file" accept="image/*" onChange={handleLogoChange} className="max-w-xs" />
              <p className="text-xs text-muted-foreground mt-1">PNG o JPG recomendado</p>
            </div>
          </CardContent>
        </Card>

        {/* Datos empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" /> Datos de la Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Nombre / Razón Social</Label><Input value={config.nombre} onChange={e => update('nombre', e.target.value)} /></div>
            <div><Label>CIF</Label><Input value={config.cif} onChange={e => update('cif', e.target.value)} /></div>
            <div className="md:col-span-2"><Label>Dirección</Label><Input value={config.direccion} onChange={e => update('direccion', e.target.value)} /></div>
            <div><Label>Ciudad</Label><Input value={config.ciudad} onChange={e => update('ciudad', e.target.value)} /></div>
            <div><Label>Teléfono</Label><Input value={config.telefono} onChange={e => update('telefono', e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={config.email} onChange={e => update('email', e.target.value)} /></div>
            <div><Label>Web</Label><Input value={config.web} onChange={e => update('web', e.target.value)} /></div>
          </CardContent>
        </Card>

        {/* Datos responsable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" /> Responsable / Coordinador
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Nombre completo</Label><Input value={config.nombre_responsable} onChange={e => update('nombre_responsable', e.target.value)} /></div>
            <div><Label>Cargo</Label><Input value={config.cargo_responsable} onChange={e => update('cargo_responsable', e.target.value)} /></div>
            <div><Label>Titulación</Label><Input value={config.titulacion} onChange={e => update('titulacion', e.target.value)} /></div>
            <div><Label>Nº Colegiado</Label><Input value={config.num_colegiado} onChange={e => update('num_colegiado', e.target.value)} /></div>
          </CardContent>
        </Card>
        {/* Datos mercantiles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="h-4 w-4" /> Datos Mercantiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div><Label>Registro Mercantil</Label><Input placeholder="Ej: Tomo X, Folio Y, Hoja Z" value={config.registro_mercantil} onChange={e => update('registro_mercantil', e.target.value)} /></div>
          </CardContent>
        </Card>

        {/* Datos bancarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" /> Datos Bancarios
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><Label>IBAN</Label><Input placeholder="ES00 0000 0000 0000 0000 0000" value={config.iban} onChange={e => update('iban', e.target.value)} /></div>
            <div><Label>Banco</Label><Input value={config.banco} onChange={e => update('banco', e.target.value)} /></div>
            <div><Label>SWIFT / BIC</Label><Input value={config.swift_bic} onChange={e => update('swift_bic', e.target.value)} /></div>
          </CardContent>
        </Card>
        {/* Plantillas de Documentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" /> Plantillas de Documentos
            </CardTitle>
            <p className="text-sm text-muted-foreground">Textos legales por defecto para cada tipo de documento. Se precargan al crear uno nuevo.</p>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {/* Informe CSS / AT */}
              <AccordionItem value="informe-css">
                <AccordionTrigger>
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Informe CSS / AT</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div>
                    <Label>Recomendaciones (sección 2)</Label>
                    <RichTextEditor value={config.texto_recomendaciones} onChange={v => update('texto_recomendaciones', v)} placeholder="Texto de recomendaciones..." />
                  </div>
                  <div>
                    <Label>Normativa aplicable (sección 11)</Label>
                    <RichTextEditor value={config.texto_normativa} onChange={v => update('texto_normativa', v)} placeholder="Lista de normativa aplicable..." />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Acta Nombramiento CAE */}
              <AccordionItem value="acta-nombramiento-cae">
                <AccordionTrigger>
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Acta Nombramiento CAE</span>
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <Label>Texto legal</Label>
                  <RichTextEditor value={config.texto_acta_nombramiento_cae} onChange={v => update('texto_acta_nombramiento_cae', v)} placeholder="Texto legal para actas de nombramiento CAE..." />
                </AccordionContent>
              </AccordionItem>

              {/* Acta Nombramiento con Proyecto */}
              <AccordionItem value="acta-nombramiento-proyecto">
                <AccordionTrigger>
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Acta Nombramiento con Proyecto</span>
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <Label>Texto legal</Label>
                  <RichTextEditor value={config.texto_acta_nombramiento_proyecto} onChange={v => update('texto_acta_nombramiento_proyecto', v)} placeholder="Texto legal para actas de nombramiento con proyecto..." />
                </AccordionContent>
              </AccordionItem>

              {/* Acta Aprobación Plan SyS */}
              <AccordionItem value="acta-aprobacion-sys">
                <AccordionTrigger>
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Acta Aprobación Plan SyS</span>
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <Label>Texto legal</Label>
                  <RichTextEditor value={config.texto_acta_aprobacion_sys} onChange={v => update('texto_acta_aprobacion_sys', v)} placeholder="Texto legal para actas de aprobación del Plan SyS..." />
                </AccordionContent>
              </AccordionItem>

              {/* Acta Aprobación DGPO */}
              <AccordionItem value="acta-aprobacion-dgpo">
                <AccordionTrigger>
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Acta Aprobación DGPO</span>
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <Label>Texto legal</Label>
                  <RichTextEditor value={config.texto_acta_aprobacion_dgpo} onChange={v => update('texto_acta_aprobacion_dgpo', v)} placeholder="Texto legal para actas de aprobación DGPO..." />
                </AccordionContent>
              </AccordionItem>

              {/* Acta Reunión Inicial */}
              <AccordionItem value="acta-reunion-inicial">
                <AccordionTrigger>
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Acta Reunión Inicial</span>
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <Label>Texto legal</Label>
                  <RichTextEditor value={config.texto_acta_reunion_inicial} onChange={v => update('texto_acta_reunion_inicial', v)} placeholder="Texto legal para actas de reunión inicial..." />
                </AccordionContent>
              </AccordionItem>

              {/* Acta Reunión CAE */}
              <AccordionItem value="acta-reunion-cae">
                <AccordionTrigger>
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Acta Reunión CAE</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div>
                    <Label>Punto 3 — Trabajos Realizados y Previstos (texto introductorio)</Label>
                    <RichTextEditor value={config.texto_cae_punto3} onChange={v => update('texto_cae_punto3', v)} placeholder="Los trabajos planificados a continuación son tratados desde el punto de vista del RD 171/04..." />
                  </div>
                  <div>
                    <Label>Punto 1 — Objetivo, alcance y ámbito de actuación</Label>
                    <RichTextEditor value={config.texto_cae_punto1} onChange={v => update('texto_cae_punto1', v)} placeholder="En cumplimiento del RD 171/2004..." />
                  </div>
                  <div>
                    <Label>Punto 2 — Intercambio de documentación (bloque 1)</Label>
                    <RichTextEditor value={config.texto_cae_punto2} onChange={v => update('texto_cae_punto2', v)} placeholder="Texto legal para el intercambio de documentación..." />
                  </div>
                  <div>
                    <Label>Punto 2 — Compromisos documentales (bloque 2)</Label>
                    <RichTextEditor value={config.texto_cae_punto2_bloque2} onChange={v => update('texto_cae_punto2_bloque2', v)} placeholder="Plazos de entrega de documentación, planificación semanal, comunicación entre empresas..." />
                  </div>
                  <div>
                    <Label>Texto legal general</Label>
                    <RichTextEditor value={config.texto_acta_reunion_cae} onChange={v => update('texto_acta_reunion_cae', v)} placeholder="Texto legal para actas de reunión CAE..." />
                  </div>
                  <div>
                    <Label>Punto 4 — Recurso preventivo</Label>
                    <RichTextEditor value={config.texto_recurso_preventivo} onChange={v => update('texto_recurso_preventivo', v)} placeholder="Texto legal sobre designación de recurso preventivo..." />
                  </div>
                  <div>
                    <Label>Punto 5 — Acuerdos Generales</Label>
                    <RichTextEditor value={config.texto_acuerdos_generales} onChange={v => update('texto_acuerdos_generales', v)} placeholder="Texto legal sobre acuerdos generales..." />
                  </div>
                  <div>
                    <Label>Punto 6 — Formación e Información</Label>
                    <RichTextEditor value={config.texto_cae_punto6} onChange={v => update('texto_cae_punto6', v)} placeholder="Texto legal sobre formación e información..." />
                  </div>
                  <div>
                    <Label>Punto 7 — Control de maquinaria</Label>
                    <RichTextEditor value={config.texto_cae_punto7} onChange={v => update('texto_cae_punto7', v)} placeholder="Texto legal sobre control de maquinaria..." />
                  </div>
                  <div>
                    <Label>Punto 8 — Protecciones Colectivas y Medios Auxiliares</Label>
                    <RichTextEditor value={config.texto_cae_punto8} onChange={v => update('texto_cae_punto8', v)} placeholder="Texto legal sobre protecciones colectivas y medios auxiliares..." />
                  </div>
                  <div>
                    <Label>Punto 9 — Protecciones Individuales</Label>
                    <RichTextEditor value={config.texto_cae_punto9} onChange={v => update('texto_cae_punto9', v)} placeholder="Texto legal sobre protecciones individuales..." />
                  </div>
                  <div>
                    <Label>Punto 10 — Interferencias entre empresas (texto legal)</Label>
                    <RichTextEditor value={config.texto_cae_punto10} onChange={v => update('texto_cae_punto10', v)} placeholder="Texto legal sobre interferencias entre empresas..." />
                  </div>
                  <div>
                    <Label>Punto 10 — Texto cuando SÍ procede</Label>
                    <RichTextEditor value={config.texto_cae_punto10_procede} onChange={v => update('texto_cae_punto10_procede', v)} placeholder="Medidas a aplicar cuando sí proceden interferencias..." />
                  </div>
                  <div>
                    <Label>Punto 13 — Ruegos y sugerencias (texto introductorio)</Label>
                    <RichTextEditor value={config.texto_cae_punto13} onChange={v => update('texto_cae_punto13', v)} placeholder="Los asistentes comunican su total intención de realizar las tareas..." />
                  </div>
                  <div>
                    <Label>Punto 13 — Texto cuando SÍ procede</Label>
                    <RichTextEditor value={config.texto_cae_punto13_procede} onChange={v => update('texto_cae_punto13_procede', v)} placeholder="Se les recuerda en cada visita semanal al centro de trabajo..." />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Acta Reunión SyS */}
              <AccordionItem value="acta-reunion-sys">
                <AccordionTrigger>
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Acta Reunión SyS</span>
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <Label>Texto legal</Label>
                  <RichTextEditor value={config.texto_acta_reunion_sys} onChange={v => update('texto_acta_reunion_sys', v)} placeholder="Texto legal para actas de reunión SyS..." />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
