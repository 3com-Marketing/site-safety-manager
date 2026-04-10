import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Scale, ChevronDown, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import FotoViewer from '@/components/visita/FotoViewer';

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
  fotos: { id: string; url: string; created_at: string }[];
}

export default function AdminVisitaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [visita, setVisita] = useState<any>(null);
  const [informe, setInforme] = useState<any>(null);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [amonestaciones, setAmonestaciones] = useState<any[]>([]);
  const [observaciones, setObservaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const { data: vis } = await supabase
        .from('visitas')
        .select('id, estado, fecha, obras(nombre), profiles!visitas_usuario_id_profiles_fkey(nombre)')
        .eq('id', id)
        .single();

      if (!vis) { setLoading(false); return; }
      setVisita(vis);

      const { data: inf } = await supabase
        .from('informes')
        .select('id, estado, fecha, num_trabajadores, condiciones_climaticas, empresas_presentes, notas_generales')
        .eq('visita_id', id)
        .single();

      if (!inf) { setLoading(false); return; }
      setInforme(inf);

      const [incsRes, checkRes, amonRes, obsRes] = await Promise.all([
        supabase.from('incidencias').select('id, titulo, descripcion, categoria, normativa, fotos(id, url, created_at)').eq('informe_id', inf.id).order('orden'),
        supabase.from('checklist_bloques').select('categoria, estado, anotaciones(id, texto, normativa, foto_url, created_at)').eq('informe_id', inf.id).order('created_at'),
        supabase.from('amonestaciones').select('*').eq('informe_id', inf.id).order('created_at'),
        supabase.from('observaciones').select('*').eq('informe_id', inf.id).order('created_at'),
      ]);

      setIncidencias((incsRes.data || []).map((i: any) => ({ ...i, fotos: i.fotos || [] })));
      setChecklist(checkRes.data || []);
      setAmonestaciones(amonRes.data || []);
      setObservaciones(obsRes.data || []);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Cargando...</p></div>;
  }

  if (!visita) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Visita no encontrada</p></div>;
  }

  const obraNombre = (visita as any).obras?.nombre || 'Obra';
  const tecnicoNombre = (visita as any).profiles?.nombre || 'Técnico';

  return (
    <div className="min-h-screen bg-background">
      <FotoViewer url={fotoUrl} onClose={() => setFotoUrl(null)} />
      
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card px-6 py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-base font-bold truncate">{obraNombre}</h1>
          <p className="text-xs text-muted-foreground">
            {tecnicoNombre} · {format(new Date(visita.fecha), "dd MMM yyyy, HH:mm", { locale: es })}
          </p>
        </div>
        <Badge variant={visita.estado === 'en_progreso' ? 'default' : 'secondary'}>
          {visita.estado === 'en_progreso' ? 'En progreso' : 'Finalizada'}
        </Badge>
      </header>

      <div className="mx-auto max-w-4xl p-6 space-y-6">
        {/* Link to informe if exists */}
        {informe && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate(`/admin/informe/${informe.id}`)}
          >
            <FileText className="h-4 w-4" />
            Ver informe completo (editable)
          </Button>
        )}

        {/* Datos Generales */}
        {informe && (
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
        )}

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
                      {a.foto_url && (
                        <div>
                          <img
                            src={a.foto_url}
                            alt="Foto"
                            className="h-20 w-20 rounded-lg object-cover border border-border cursor-pointer hover:ring-2 hover:ring-primary"
                            onClick={() => setFotoUrl(a.foto_url)}
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">📅 {format(new Date(a.created_at), "dd MMM yyyy, HH:mm", { locale: es })}</p>
                        </div>
                      )}
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
            {incidencias.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sin incidencias</p>
            ) : incidencias.map((inc, idx) => (
              <div key={inc.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {CATEGORIAS[inc.categoria] || inc.categoria}
                  </span>
                  <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                </div>
                <p className="font-heading font-semibold text-sm">{inc.titulo}</p>
                {inc.descripcion && <p className="text-sm text-muted-foreground">{inc.descripcion}</p>}
                {inc.fotos.length > 0 && (
                  <div className="flex gap-3 flex-wrap">
                    {inc.fotos.map(f => (
                      <div key={f.id}>
                        <img
                          src={f.url}
                          alt="Foto"
                          className="h-24 w-24 rounded-lg object-cover border border-border cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                          onClick={() => setFotoUrl(f.url)}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">📅 {format(new Date(f.created_at), "dd MMM yyyy, HH:mm", { locale: es })}</p>
                      </div>
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
            ))}
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
                {a.foto_url && (
                  <img
                    src={a.foto_url}
                    alt="Foto"
                    className="h-20 w-20 rounded-lg object-cover border border-border cursor-pointer hover:ring-2 hover:ring-primary"
                    onClick={() => setFotoUrl(a.foto_url)}
                  />
                )}
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
                {obs.foto_url && (
                  <img
                    src={obs.foto_url}
                    alt="Foto"
                    className="h-20 w-20 rounded-lg object-cover border border-border cursor-pointer hover:ring-2 hover:ring-primary"
                    onClick={() => setFotoUrl(obs.foto_url)}
                  />
                )}
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
