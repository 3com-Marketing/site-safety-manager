import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, FileDown, Save, Loader2, Scale, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import FotoViewer from '@/components/visita/FotoViewer';
import EditableTextWithAI from '@/components/visita/EditableTextWithAI';
import ConfirmarFirmaDialog from '@/components/informes/ConfirmarFirmaDialog';
import { useAuth } from '@/lib/auth';

const CATEGORIAS: Record<string, string> = {
  EPIs: 'EPIs',
  orden_limpieza: 'Orden y limpieza',
  altura: 'Trabajo en altura',
  señalizacion: 'Señalización',
  maquinaria: 'Maquinaria',
  general: 'General',
};

interface Incidencia {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  normativa: string;
  fotos: { id: string; url: string }[];
}

export default function AdminInformeDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [informe, setInforme] = useState<any>(null);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [amonestaciones, setAmonestaciones] = useState<any[]>([]);
  const [observaciones, setObservaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedFields, setEditedFields] = useState<Record<string, { titulo: string; descripcion: string }>>({});
  const [editedInforme, setEditedInforme] = useState<Partial<{
    num_trabajadores: number | null;
    condiciones_climaticas: string;
    empresas_presentes: string;
    notas_generales: string;
  }>>({});
  const [editedAmonestaciones, setEditedAmonestaciones] = useState<Record<string, { trabajador: string; descripcion: string }>>({});
  const [editedObservaciones, setEditedObservaciones] = useState<Record<string, { texto: string }>>({});
  const [editedAnotaciones, setEditedAnotaciones] = useState<Record<string, { texto?: string; normativa?: string }>>({});
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [viewingFoto, setViewingFoto] = useState<string | null>(null);
  const [fotoMeta, setFotoMeta] = useState<{ table: string; id: string; column: string } | null>(null);
  const [visitaId, setVisitaId] = useState<string | null>(null);
  const [firmaPerfilUrl, setFirmaPerfilUrl] = useState<string | null>(null);
  const [firmaDialogOpen, setFirmaDialogOpen] = useState(false);
  const { user } = useAuth();

  // New item forms
  const [newIncidencia, setNewIncidencia] = useState({ titulo: '', descripcion: '' });
  const [newAmonestacion, setNewAmonestacion] = useState({ trabajador: '', descripcion: '' });
  const [newObservacion, setNewObservacion] = useState({ texto: '' });

  const fetchData = async () => {
    if (!id) return;

    const { data: inf } = await supabase
      .from('informes')
      .select('id, estado, fecha, num_trabajadores, condiciones_climaticas, empresas_presentes, notas_generales, visitas(id, obras(nombre), profiles!visitas_usuario_id_profiles_fkey(nombre))')
      .eq('id', id)
      .single();

    setInforme(inf);
    if (inf?.visitas) setVisitaId((inf.visitas as any).id || null);

    const [incsRes, checkRes, amonRes, obsRes] = await Promise.all([
      supabase.from('incidencias').select('id, titulo, descripcion, categoria, normativa, fotos(id, url)').eq('informe_id', id).order('orden'),
      supabase.from('checklist_bloques').select('categoria, estado, anotaciones(id, texto, normativa, foto_url, created_at)').eq('informe_id', id).order('created_at'),
      supabase.from('amonestaciones').select('*').eq('informe_id', id).order('created_at'),
      supabase.from('observaciones').select('*').eq('informe_id', id).order('created_at'),
    ]);

    setIncidencias((incsRes.data || []).map((i: any) => ({ ...i, fotos: i.fotos || [] })));
    setChecklist(checkRes.data || []);
    setAmonestaciones(amonRes.data || []);
    setObservaciones(obsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  useEffect(() => {
    if (!user) { setFirmaPerfilUrl(null); return; }
    (async () => {
      const { data } = await supabase
        .from('tecnicos')
        .select('firma_url')
        .eq('user_id', user.id)
        .maybeSingle();
      setFirmaPerfilUrl((data as any)?.firma_url || null);
    })();
  }, [user]);

  const handleFieldChange = (incId: string, field: 'titulo' | 'descripcion', value: string) => {
    setEditedFields(prev => ({
      ...prev,
      [incId]: {
        titulo: prev[incId]?.titulo ?? incidencias.find(i => i.id === incId)!.titulo,
        descripcion: prev[incId]?.descripcion ?? incidencias.find(i => i.id === incId)!.descripcion,
        [field]: value,
      },
    }));
  };

  const handleInformeChange = (field: string, value: any) => {
    setEditedInforme(prev => ({ ...prev, [field]: value }));
  };

  const handleAmonestacionChange = (amonId: string, field: 'trabajador' | 'descripcion', value: string) => {
    const amon = amonestaciones.find(a => a.id === amonId)!;
    setEditedAmonestaciones(prev => ({
      ...prev,
      [amonId]: {
        trabajador: prev[amonId]?.trabajador ?? amon.trabajador,
        descripcion: prev[amonId]?.descripcion ?? amon.descripcion,
        [field]: value,
      },
    }));
  };

  const handleObservacionChange = (obsId: string, value: string) => {
    setEditedObservaciones(prev => ({
      ...prev,
      [obsId]: { texto: value },
    }));
  };

  const handleAnotacionChange = (anotId: string, field: 'texto' | 'normativa', value: string) => {
    setEditedAnotaciones(prev => ({
      ...prev,
      [anotId]: { ...prev[anotId], [field]: value },
    }));
  };

  const hasEdits = Object.keys(editedFields).length > 0
    || Object.keys(editedInforme).length > 0
    || Object.keys(editedAmonestaciones).length > 0
    || Object.keys(editedObservaciones).length > 0
    || Object.keys(editedAnotaciones).length > 0;

  const saveChanges = async () => {
    setSaving(true);

    // Save incidencias
    for (const [incId, fields] of Object.entries(editedFields)) {
      await supabase.from('incidencias').update({ titulo: fields.titulo, descripcion: fields.descripcion }).eq('id', incId);
    }

    // Save informe general data
    if (Object.keys(editedInforme).length > 0 && id) {
      await supabase.from('informes').update(editedInforme).eq('id', id);
    }

    // Save amonestaciones
    for (const [amonId, fields] of Object.entries(editedAmonestaciones)) {
      await supabase.from('amonestaciones').update({ trabajador: fields.trabajador, descripcion: fields.descripcion }).eq('id', amonId);
    }

    // Save observaciones
    for (const [obsId, fields] of Object.entries(editedObservaciones)) {
      await supabase.from('observaciones').update({ texto: fields.texto }).eq('id', obsId);
    }

    // Save anotaciones
    for (const [anotId, fields] of Object.entries(editedAnotaciones)) {
      await supabase.from('anotaciones').update(fields).eq('id', anotId);
    }

    setEditedFields({});
    setEditedInforme({});
    setEditedAmonestaciones({});
    setEditedObservaciones({});
    setEditedAnotaciones({});
    toast.success('Cambios guardados');
    await fetchData();
    setSaving(false);
  };

  const markAsReviewed = () => {
    if (!id) return;
    setFirmaDialogOpen(true);
  };

  const closeWithFirma = async (payload: { useStored: true } | { blob: Blob }) => {
    if (!id) return;
    let firmaUrl: string | null = null;
    if ('useStored' in payload) {
      firmaUrl = firmaPerfilUrl;
    } else {
      const path = `firmas-informes/${id}_${Date.now()}.png`;
      const { error: upErr } = await supabase.storage.from('logos').upload(path, payload.blob, {
        contentType: 'image/png', upsert: true,
      });
      if (upErr) { toast.error('Error al subir la firma'); return; }
      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path);
      firmaUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('informes').update({
      estado: 'cerrado',
      firma_url: firmaUrl,
      firma_at: new Date().toISOString(),
    } as any).eq('id', id);
    if (error) { toast.error('Error al cerrar el informe'); return; }

    toast.success('Informe cerrado y firmado');
    setFirmaDialogOpen(false);
    await fetchData();
  };

  const addIncidencia = async () => {
    if (!id || !newIncidencia.titulo.trim()) return;
    await supabase.from('incidencias').insert({
      informe_id: id,
      titulo: newIncidencia.titulo,
      descripcion: newIncidencia.descripcion,
      categoria: 'general',
      orden: incidencias.length,
    });
    setNewIncidencia({ titulo: '', descripcion: '' });
    toast.success('Incidencia añadida');
    await fetchData();
  };

  const addAmonestacion = async () => {
    if (!id || !newAmonestacion.trabajador.trim()) return;
    await supabase.from('amonestaciones').insert({
      informe_id: id,
      trabajador: newAmonestacion.trabajador,
      descripcion: newAmonestacion.descripcion,
    });
    setNewAmonestacion({ trabajador: '', descripcion: '' });
    toast.success('Amonestación añadida');
    await fetchData();
  };

  const addObservacion = async () => {
    if (!id || !newObservacion.texto.trim()) return;
    await supabase.from('observaciones').insert({
      informe_id: id,
      texto: newObservacion.texto,
    });
    setNewObservacion({ texto: '' });
    toast.success('Observación añadida');
    await fetchData();
  };

  const generatePDF = async () => {
    if (!id) return;
    setGeneratingPdf(true);

    try {
      const { data, error } = await supabase.functions.invoke('generar-pdf', {
        body: { informe_id: id },
      });

      if (error) {
        toast.error('Error al generar el informe');
        console.error(error);
        setGeneratingPdf(false);
        return;
      }

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(data.html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      } else {
        toast.error('El navegador bloqueó la ventana emergente. Permite las ventanas emergentes.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el PDF');
    }

    setGeneratingPdf(false);
  };

  const mergeAnotaciones = (anotaciones: any[]) => {
    const merged: any[] = [];
    let i = 0;
    while (i < anotaciones.length) {
      const current = anotaciones[i];
      const next = anotaciones[i + 1];
      if (current.foto_url && !current.texto && !current.normativa
          && next && !next.foto_url && (next.texto || next.normativa)) {
        merged.push({
          id: next.id,
          foto_id: current.id,
          foto_url: current.foto_url,
          texto: next.texto,
          normativa: next.normativa,
        });
        i += 2;
      } else {
        merged.push(current);
        i += 1;
      }
    }
    return merged;
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Cargando...</p></div>;
  }

  if (!informe) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Informe no encontrado</p></div>;
  }

  const obraNombre = informe.visitas?.obras?.nombre || 'Obra';
  const tecnicoNombre = informe.visitas?.profiles?.nombre || 'Técnico';

  // Helper to get current value (edited or original)
  const informeVal = (field: string) => editedInforme[field] ?? informe[field] ?? '';

  const handleSaveFoto = async (newUrl: string) => {
    if (!fotoMeta) return;
    const { error } = await supabase.from(fotoMeta.table as any).update({ [fotoMeta.column]: newUrl }).eq('id', fotoMeta.id);
    if (error) {
      console.error('Error updating photo URL:', error);
      toast.error('Error al guardar la foto editada');
      throw error;
    }
    setViewingFoto(null);
    setFotoMeta(null);
    await fetchData();
  };

  return (
    <div className="min-h-screen bg-background">
      <FotoViewer
        url={viewingFoto}
        onClose={() => { setViewingFoto(null); setFotoMeta(null); }}
        editable
        visitaId={visitaId || undefined}
        onSave={handleSaveFoto}
      />
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card px-6 py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-base font-bold truncate">{obraNombre}</h1>
          <p className="text-xs text-muted-foreground">
            {tecnicoNombre} · {format(new Date(informe.fecha), "dd MMM yyyy", { locale: es })}
          </p>
        </div>
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
          informe.estado === 'cerrado' ? 'bg-success/10 text-success' :
          informe.estado === 'pendiente_revision' ? 'bg-warning/10 text-warning' :
          'bg-muted text-muted-foreground'
        }`}>
          {informe.estado === 'cerrado' ? 'Cerrado' : informe.estado === 'pendiente_revision' ? 'Pendiente' : 'Borrador'}
        </span>
      </header>

      <div className="mx-auto max-w-4xl p-6 space-y-6">
        {/* Action buttons */}
        <div className="flex gap-3 flex-wrap">
          {hasEdits && (
            <Button onClick={saveChanges} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          )}
          {informe.estado !== 'cerrado' && (
            <Button onClick={markAsReviewed} variant="outline" className="gap-2 border-success text-success hover:bg-success/10">
              <CheckCircle className="h-4 w-4" />
              Marcar como revisado
            </Button>
          )}
          <Button onClick={generatePDF} variant="outline" className="gap-2" disabled={generatingPdf}>
            {generatingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {generatingPdf ? 'Generando...' : 'Generar PDF'}
          </Button>
        </div>

        {/* Datos Generales - EDITABLE */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
            <ChevronDown className="h-4 w-4 transition-transform data-[state=closed]:rotate-[-90deg]" />
            <h2 className="font-heading text-lg font-semibold">Datos Generales</h2>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="rounded-lg bg-muted p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Nº Trabajadores</p>
                <Input
                  type="number"
                  value={informeVal('num_trabajadores')}
                  onChange={e => handleInformeChange('num_trabajadores', e.target.value ? parseInt(e.target.value) : null)}
                  className="h-8 text-sm"
                  placeholder="0"
                />
              </div>
              <div className="rounded-lg bg-muted p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Condiciones climáticas</p>
                <Input
                  value={informeVal('condiciones_climaticas')}
                  onChange={e => handleInformeChange('condiciones_climaticas', e.target.value)}
                  className="h-8 text-sm"
                  placeholder="Soleado, lluvioso..."
                />
              </div>
              <div className="rounded-lg bg-muted p-3 col-span-2 space-y-1">
                <p className="text-xs text-muted-foreground">Empresas presentes</p>
                <Input
                  value={informeVal('empresas_presentes')}
                  onChange={e => handleInformeChange('empresas_presentes', e.target.value)}
                  className="h-8 text-sm"
                  placeholder="Empresas..."
                />
              </div>
              <div className="rounded-lg bg-muted p-3 col-span-2 space-y-1">
                <p className="text-xs text-muted-foreground">Notas generales</p>
                <Textarea
                  value={informeVal('notas_generales')}
                  onChange={e => handleInformeChange('notas_generales', e.target.value)}
                  className="text-sm min-h-[60px]"
                  placeholder="Notas..."
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Checklist */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
            <ChevronDown className="h-4 w-4 transition-transform data-[state=closed]:rotate-[-90deg]" />
            <h2 className="font-heading text-lg font-semibold">Checklist ({checklist.reduce((s: number, b: any) => s + (b.anotaciones?.length || 0), 0)} anotaciones)</h2>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            {checklist.map((bloque: any) => (
              <div key={bloque.categoria} className="space-y-2">
                <h3 className="text-sm font-semibold">{CATEGORIAS[bloque.categoria] || bloque.categoria}</h3>
                {(!bloque.anotaciones || bloque.anotaciones.length === 0) ? (
                  <p className="text-xs text-muted-foreground italic">Sin anotaciones</p>
                ) : mergeAnotaciones(bloque.anotaciones).map((a: any) => {
                    const editedAnot = editedAnotaciones[a.id];
                    return (
                      <div key={a.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Descripción</p>
                          <EditableTextWithAI
                            compact
                            value={editedAnot?.texto ?? a.texto ?? ''}
                            onChange={(v) => handleAnotacionChange(a.id, 'texto', v)}
                            onSave={() => {}}
                            onCancel={() => {}}
                            categoria={`Anotación de checklist - ${CATEGORIAS[bloque.categoria] || bloque.categoria}`}
                            onNormativaUpdate={(n) => handleAnotacionChange(a.id, 'normativa', n)}
                          />
                        </div>
                        {a.foto_url && (
                          <img
                            src={a.foto_url}
                            alt="Foto"
                            className="h-20 w-20 rounded-lg object-cover border border-border cursor-pointer hover:ring-2 hover:ring-primary"
                            onClick={() => { setViewingFoto(a.foto_url); setFotoMeta({ table: 'anotaciones', id: a.foto_id || a.id, column: 'foto_url' }); }}
                          />
                        )}
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Scale className="h-3 w-3 text-primary" /> Normativa
                          </p>
                          <Textarea
                            value={editedAnot?.normativa ?? a.normativa ?? ''}
                            onChange={e => handleAnotacionChange(a.id, 'normativa', e.target.value)}
                            className="text-sm min-h-[40px]"
                            placeholder="Normativa aplicable..."
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Incidencias - EDITABLE */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
            <ChevronDown className="h-4 w-4 transition-transform data-[state=closed]:rotate-[-90deg]" />
            <h2 className="font-heading text-lg font-semibold">Incidencias ({incidencias.length})</h2>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-3">
            {incidencias.map((inc, idx) => {
              const edited = editedFields[inc.id];
              return (
                <div key={inc.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {CATEGORIAS[inc.categoria] || inc.categoria}
                    </span>
                    <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                  </div>
                  <Input
                    value={edited?.titulo ?? inc.titulo}
                    onChange={e => handleFieldChange(inc.id, 'titulo', e.target.value)}
                    className="font-heading font-semibold text-sm"
                  />
                  <EditableTextWithAI
                    compact
                    value={edited?.descripcion ?? inc.descripcion}
                    onChange={(v) => handleFieldChange(inc.id, 'descripcion', v)}
                    onSave={() => {}}
                    onCancel={() => {}}
                    categoria={`Incidencia - ${CATEGORIAS[inc.categoria] || inc.categoria}`}
                  />
                  {inc.fotos.length > 0 && (
                    <div className="flex gap-3 flex-wrap">
                      {inc.fotos.map(f => (
                        <img
                          key={f.id}
                          src={f.url}
                          alt="Foto"
                          className="h-24 w-24 rounded-lg object-cover border border-border hover:ring-2 hover:ring-primary transition-all cursor-pointer"
                          onClick={() => { setViewingFoto(f.url); setFotoMeta({ table: 'fotos', id: f.id, column: 'url' }); }}
                        />
                      ))}
                    </div>
                  )}
                  {inc.normativa && (
                    <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <Scale className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <span className="whitespace-pre-line">{inc.normativa}</span>
                    </div>
                  )}
                </div>
              );
            })}
            {/* Formulario nueva incidencia */}
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Nueva incidencia</p>
              <Input
                value={newIncidencia.titulo}
                onChange={e => setNewIncidencia(prev => ({ ...prev, titulo: e.target.value }))}
                className="font-heading font-semibold text-sm"
                placeholder="Título..."
              />
              <Textarea
                value={newIncidencia.descripcion}
                onChange={e => setNewIncidencia(prev => ({ ...prev, descripcion: e.target.value }))}
                className="text-sm min-h-[60px]"
                placeholder="Descripción..."
              />
              <Button onClick={addIncidencia} size="sm" disabled={!newIncidencia.titulo.trim()}>
                Añadir incidencia
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Amonestaciones - EDITABLE */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
            <ChevronDown className="h-4 w-4 transition-transform data-[state=closed]:rotate-[-90deg]" />
            <h2 className="font-heading text-lg font-semibold">Amonestaciones ({amonestaciones.length})</h2>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            {amonestaciones.map((a: any) => {
              const edited = editedAmonestaciones[a.id];
              return (
                <div key={a.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Trabajador</p>
                    <Input
                      value={edited?.trabajador ?? a.trabajador}
                      onChange={e => handleAmonestacionChange(a.id, 'trabajador', e.target.value)}
                      className="h-8 text-sm font-semibold"
                      placeholder="Nombre del trabajador"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Descripción</p>
                    <EditableTextWithAI
                      compact
                      value={edited?.descripcion ?? a.descripcion}
                      onChange={(v) => handleAmonestacionChange(a.id, 'descripcion', v)}
                      onSave={() => {}}
                      onCancel={() => {}}
                      categoria="Amonestación a trabajador en obra"
                    />
                  </div>
                  {a.foto_url && (
                    <img
                      src={a.foto_url}
                      alt="Foto"
                      className="h-20 w-20 rounded-lg object-cover border border-border cursor-pointer hover:ring-2 hover:ring-primary"
                      onClick={() => { setViewingFoto(a.foto_url); setFotoMeta({ table: 'amonestaciones', id: a.id, column: 'foto_url' }); }}
                    />
                  )}
                  {a.normativa && (
                    <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <Scale className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <span className="whitespace-pre-line">{a.normativa}</span>
                    </div>
                  )}
                </div>
              );
            })}
            {/* Formulario nueva amonestación */}
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Nueva amonestación</p>
              <Input
                value={newAmonestacion.trabajador}
                onChange={e => setNewAmonestacion(prev => ({ ...prev, trabajador: e.target.value }))}
                className="h-8 text-sm font-semibold"
                placeholder="Nombre del trabajador"
              />
              <Textarea
                value={newAmonestacion.descripcion}
                onChange={e => setNewAmonestacion(prev => ({ ...prev, descripcion: e.target.value }))}
                className="text-sm min-h-[60px]"
                placeholder="Descripción..."
              />
              <Button onClick={addAmonestacion} size="sm" disabled={!newAmonestacion.trabajador.trim()}>
                Añadir amonestación
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Observaciones - EDITABLE */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
            <ChevronDown className="h-4 w-4 transition-transform data-[state=closed]:rotate-[-90deg]" />
            <h2 className="font-heading text-lg font-semibold">Observaciones ({observaciones.length})</h2>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            {observaciones.map((obs: any) => {
              const edited = editedObservaciones[obs.id];
              return (
                <div key={obs.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <EditableTextWithAI
                    compact
                    value={edited?.texto ?? obs.texto}
                    onChange={(v) => handleObservacionChange(obs.id, v)}
                    onSave={() => {}}
                    onCancel={() => {}}
                    categoria="Observación general en visita de obra"
                  />
                  {obs.foto_url && (
                    <img
                      src={obs.foto_url}
                      alt="Foto"
                      className="h-20 w-20 rounded-lg object-cover border border-border cursor-pointer hover:ring-2 hover:ring-primary"
                      onClick={() => { setViewingFoto(obs.foto_url); setFotoMeta({ table: 'observaciones', id: obs.id, column: 'foto_url' }); }}
                    />
                  )}
                  {obs.normativa && (
                    <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <Scale className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <span className="whitespace-pre-line">{obs.normativa}</span>
                    </div>
                  )}
                </div>
              );
            })}
            {/* Formulario nueva observación */}
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Nueva observación</p>
              <Textarea
                value={newObservacion.texto}
                onChange={e => setNewObservacion({ texto: e.target.value })}
                className="text-sm min-h-[60px]"
                placeholder="Texto de la observación..."
              />
              <Button onClick={addObservacion} size="sm" disabled={!newObservacion.texto.trim()}>
                Añadir observación
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
