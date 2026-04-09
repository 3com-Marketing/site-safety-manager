import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, FileDown, Save } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CATEGORIAS: Record<string, string> = {
  EPIs: 'EPIs',
  orden_limpieza: 'Orden y limpieza',
  altura: 'Trabajo en altura',
  señalizacion: 'Señalización',
  maquinaria: 'Maquinaria',
};

interface Incidencia {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  fotos: { id: string; url: string }[];
}

export default function AdminInformeDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [informe, setInforme] = useState<any>(null);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedFields, setEditedFields] = useState<Record<string, { titulo: string; descripcion: string }>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!id) return;

    const { data: inf } = await supabase
      .from('informes')
      .select('id, estado, fecha, visitas(obras(nombre), profiles:usuario_id(nombre))')
      .eq('id', id)
      .single();

    setInforme(inf);

    const { data: incs } = await supabase
      .from('incidencias')
      .select('id, titulo, descripcion, categoria, fotos(id, url)')
      .eq('informe_id', id)
      .order('orden');

    setIncidencias((incs || []).map((i: any) => ({ ...i, fotos: i.fotos || [] })));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

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
      await supabase.from('incidencias').update({
        titulo: fields.titulo,
        descripcion: fields.descripcion,
      }).eq('id', incId);
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

  const generatePDF = () => {
    toast.info('Generación de PDF simulada. Se implementará próximamente.');
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Cargando...</p></div>;
  }

  if (!informe) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Informe no encontrado</p></div>;
  }

  const obraNombre = (informe as any).visitas?.obras?.nombre || 'Obra';
  const tecnicoNombre = (informe as any).visitas?.profiles?.nombre || 'Técnico';
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
          <Button onClick={generatePDF} variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            Generar PDF
          </Button>
        </div>

        {/* Incidencias */}
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold">Incidencias ({incidencias.length})</h2>
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
                        <img
                          src={f.url}
                          alt="Foto"
                          className="h-24 w-24 rounded-lg object-cover border border-border hover:ring-2 hover:ring-primary transition-all"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
