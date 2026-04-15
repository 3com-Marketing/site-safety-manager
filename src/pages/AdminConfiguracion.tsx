import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Upload, Loader2, Building2, User, Landmark, CreditCard, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
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
  texto_acta_aprobacion_dgpo: string;
  texto_acta_reunion_inicial: string;
  texto_acta_reunion_cae: string;
  texto_acta_reunion_sys: string;
  texto_acta_nombramiento_cae: string;
  texto_acta_nombramiento_proyecto: string;
}

const EMPTY_CONFIG: ConfigEmpresa = {
  nombre: '', cif: '', direccion: '', ciudad: '', telefono: '',
  email: '', web: '', logo_url: '', nombre_responsable: '',
  cargo_responsable: '', titulacion: '', num_colegiado: '',
  registro_mercantil: '', iban: '', banco: '', swift_bic: '',
  texto_recomendaciones: '', texto_normativa: '',
  texto_acta_aprobacion_sys: '', texto_acta_aprobacion_dgpo: '',
  texto_acta_reunion_inicial: '', texto_acta_reunion_cae: '', texto_acta_reunion_sys: '',
  texto_acta_nombramiento_cae: '', texto_acta_nombramiento_proyecto: '',
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
        {/* Textos legales por defecto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" /> Textos Legales por Defecto (Informes)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Recomendaciones (sección 2 del informe)</Label>
              <Textarea
                value={config.texto_recomendaciones}
                onChange={e => update('texto_recomendaciones', e.target.value)}
                rows={10}
                placeholder="Texto legal de recomendaciones que se precargará en nuevos informes CSS/AT..."
                className="text-xs mt-1"
              />
            </div>
            <div>
              <Label>Normativa aplicable (sección 11 del informe)</Label>
              <Textarea
                value={config.texto_normativa}
                onChange={e => update('texto_normativa', e.target.value)}
                rows={10}
                placeholder="Lista de normativa aplicable que se precargará en nuevos informes CSS/AT..."
                className="text-xs mt-1"
              />
            </div>
            <div>
              <Label>Texto Acta Aprobación Plan SyS</Label>
              <Textarea
                value={config.texto_acta_aprobacion_sys}
                onChange={e => update('texto_acta_aprobacion_sys', e.target.value)}
                rows={10}
                placeholder="Texto legal por defecto para actas de aprobación del Plan de Seguridad y Salud..."
                className="text-xs mt-1"
              />
            </div>
            <div>
              <Label>Texto Acta Aprobación DGPO</Label>
              <Textarea
                value={config.texto_acta_aprobacion_dgpo}
                onChange={e => update('texto_acta_aprobacion_dgpo', e.target.value)}
                rows={10}
                placeholder="Texto legal por defecto para actas de aprobación DGPO..."
                className="text-xs mt-1"
              />
            </div>
            <div>
              <Label>Texto Acta Reunión Inicial</Label>
              <Textarea
                value={config.texto_acta_reunion_inicial}
                onChange={e => update('texto_acta_reunion_inicial', e.target.value)}
                rows={10}
                placeholder="Texto legal por defecto para actas de reunión inicial (puntos a-o coordinación)..."
                className="text-xs mt-1"
              />
            </div>
            <div>
              <Label>Texto Acta Reunión CAE</Label>
              <Textarea
                value={config.texto_acta_reunion_cae}
                onChange={e => update('texto_acta_reunion_cae', e.target.value)}
                rows={10}
                placeholder="Texto legal por defecto para actas de reunión CAE (13 secciones)..."
                className="text-xs mt-1"
              />
            </div>
            <div>
              <Label>Texto Acta Reunión SyS</Label>
              <Textarea
                value={config.texto_acta_reunion_sys}
                onChange={e => update('texto_acta_reunion_sys', e.target.value)}
                rows={10}
                placeholder="Texto legal por defecto para actas de reunión de seguridad y salud..."
                className="text-xs mt-1"
              />
            </div>
            <div>
              <Label>Texto Acta Nombramiento CAE</Label>
              <Textarea
                value={config.texto_acta_nombramiento_cae}
                onChange={e => update('texto_acta_nombramiento_cae', e.target.value)}
                rows={10}
                placeholder="Texto legal por defecto para actas de nombramiento CAE (RD 171/2004)..."
                className="text-xs mt-1"
              />
            </div>
            <div>
              <Label>Texto Acta Nombramiento Con Proyecto</Label>
              <Textarea
                value={config.texto_acta_nombramiento_proyecto}
                onChange={e => update('texto_acta_nombramiento_proyecto', e.target.value)}
                rows={10}
                placeholder="Texto legal por defecto para actas de nombramiento con proyecto (RD 1627/1997)..."
                className="text-xs mt-1"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
