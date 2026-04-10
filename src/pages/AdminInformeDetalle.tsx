import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, FileDown, Save, Loader2, Scale, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const fetchData = async () => {
    if (!id) return;

    const { data: inf } = await supabase
      .from('informes')
      .select('id, estado, fecha, num_trabajadores, condiciones_climaticas, empresas_presentes, notas_generales, visitas(obras(nombre), profiles!visitas_usuario_id_profiles_fkey(nombre))')
      .eq('id', id)
      .single();

    setInforme(inf);

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

  const saveChanges = async () => {
    setSaving(true);
    for (const [incId, fields] of Object.entries(editedFields)) {
      await supabase.from('incidencias').update({ titulo: fields.titulo, descripcion: fields.descripcion }).eq('id', incId);
    }
    setEditedFields({});
    toast.success('Cambios guardados');
    await fetchData();
    setSaving(false);
  };

  const markAsReviewed = async () => {
    if (!id) return;
    await supabase.from('informes').update({ estado: 'cerrado' }).eq('id', id);
    toast.success('Informe marcado como revisado');
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

      // Open HTML in new window for print/PDF
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

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Cargando...</p></div>;
  }

  if (!informe) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Informe no encontrado</p></div>;
  }

  const obraNombre = informe.visitas?.obras?.nombre || 'Obra';
  const tecnicoNombre = informe.visitas?.profiles?.nombre || 'Técnico';
  const hasEdits = Object.keys(editedFields).length > 0;

  return (
    <div className="min-h-screen bg-background">
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

        {/* Datos Generales */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
            <ChevronDown className="h-4 w-4 transition-transform data-[state=closed]:rotate-[-90deg]" />
            <h2 className="font-heading text-lg font-semibold">Datos Generales</h2>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Nº Trabajadores</p>
                <p className="text-sm font-medium">{informe.num_trabajadores ?? '—'}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Condiciones climáticas</p>
                <p className="text-sm font-medium">{informe.condiciones_climaticas || '—'}</p>
              </div>
              <div className="rounded-lg bg-muted p-3 col-span-2">
                <p className="text-xs text-muted-foreground">Empresas presentes</p>
                <p className="text-sm font-medium">{informe.empresas_presentes || '—'}</p>
              </div>
              {informe.notas_generales && (
                <div className="rounded-lg bg-muted p-3 col-span-2">
                  <p className="text-xs text-muted-foreground">Notas generales</p>
                  <p className="text-sm font-medium">{informe.notas_generales}</p>
                </div>
              )}
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
                ) : (
                  bloque.anotaciones.map((a: any) => (
                    <div key={a.id} className="rounded-lg border border-border bg-card p-3 space-y-1.5">
                      {a.texto && <p className="text-sm">{a.texto}</p>}
                      {a.foto_url && <img src={a.foto_url} alt="Foto" className="h-20 w-20 rounded-lg object-cover border border-border" />}
                      {a.normativa && (
                        <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                          <Scale className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                          <span className="whitespace-pre-line">{a.normativa}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Incidencias */}
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
                  <Textarea
                    value={edited?.descripcion ?? inc.descripcion}
                    onChange={e => handleFieldChange(inc.id, 'descripcion', e.target.value)}
                    className="text-sm min-h-[60px]"
                    placeholder="Descripción..."
                  />
                  {inc.fotos.length > 0 && (
                    <div className="flex gap-3 flex-wrap">
                      {inc.fotos.map(f => (
                        <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer">
                          <img src={f.url} alt="Foto" className="h-24 w-24 rounded-lg object-cover border border-border hover:ring-2 hover:ring-primary transition-all" />
                        </a>
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
          </CollapsibleContent>
        </Collapsible>

        {/* Amonestaciones */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
            <ChevronDown className="h-4 w-4 transition-transform data-[state=closed]:rotate-[-90deg]" />
            <h2 className="font-heading text-lg font-semibold">Amonestaciones ({amonestaciones.length})</h2>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            {amonestaciones.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sin amonestaciones</p>
            ) : amonestaciones.map((a: any) => (
              <div key={a.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                {a.trabajador && <p className="text-sm font-semibold">{a.trabajador}</p>}
                {a.descripcion && <p className="text-sm">{a.descripcion}</p>}
                {a.foto_url && <img src={a.foto_url} alt="Foto" className="h-20 w-20 rounded-lg object-cover border border-border" />}
                {a.normativa && (
                  <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <Scale className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    <span className="whitespace-pre-line">{a.normativa}</span>
                  </div>
                )}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Observaciones */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
            <ChevronDown className="h-4 w-4 transition-transform data-[state=closed]:rotate-[-90deg]" />
            <h2 className="font-heading text-lg font-semibold">Observaciones ({observaciones.length})</h2>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            {observaciones.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sin observaciones</p>
            ) : observaciones.map((obs: any) => (
              <div key={obs.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                {obs.texto && <p className="text-sm">{obs.texto}</p>}
                {obs.foto_url && <img src={obs.foto_url} alt="Foto" className="h-20 w-20 rounded-lg object-cover border border-border" />}
                {obs.normativa && (
                  <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <Scale className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    <span className="whitespace-pre-line">{obs.normativa}</span>
                  </div>
                )}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
