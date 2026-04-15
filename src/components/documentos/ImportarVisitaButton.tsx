import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface VisitaImportData {
  visita: { id: string; fecha: string; fecha_fin: string | null };
  informe: {
    notas_generales: string | null;
    empresas_presentes: string | null;
    num_trabajadores: number | null;
  };
  bloques: Array<{
    categoria: string;
    estado: string;
    anotaciones: Array<{ texto: string; etiqueta: string }>;
  }>;
  incidencias: Array<{ titulo: string; descripcion: string; categoria: string }>;
  observaciones: Array<{ texto: string; etiqueta: string }>;
}

interface Props {
  obraId: string;
  onImport: (data: VisitaImportData) => void;
}

export default function ImportarVisitaButton({ obraId, onImport }: Props) {
  const [loading, setLoading] = useState(false);
  const [visitas, setVisitas] = useState<Array<{ id: string; fecha: string; fecha_fin: string | null }>>([]);
  const [open, setOpen] = useState(false);

  const fetchVisitas = async () => {
    const { data, error } = await supabase
      .from('visitas')
      .select('id, fecha, fecha_fin')
      .eq('obra_id', obraId)
      .eq('estado', 'finalizada')
      .order('fecha_fin', { ascending: false });

    if (error) {
      toast.error('Error al buscar visitas');
      return null;
    }
    return data || [];
  };

  const importVisita = async (visitaId: string, fecha: string, fechaFin: string | null) => {
    setLoading(true);
    setOpen(false);
    try {
      // Get informe
      const { data: informe } = await supabase
        .from('informes')
        .select('id, notas_generales, empresas_presentes, num_trabajadores')
        .eq('visita_id', visitaId)
        .limit(1)
        .maybeSingle();

      if (!informe) {
        toast.error('No se encontró informe para esta visita');
        return;
      }

      // Fetch bloques with anotaciones, incidencias, observaciones in parallel
      const [bloquesRes, incidenciasRes, observacionesRes] = await Promise.all([
        supabase
          .from('checklist_bloques')
          .select('categoria, estado, anotaciones(texto, etiqueta)')
          .eq('informe_id', informe.id),
        supabase
          .from('incidencias')
          .select('titulo, descripcion, categoria')
          .eq('informe_id', informe.id),
        supabase
          .from('observaciones')
          .select('texto, etiqueta')
          .eq('informe_id', informe.id),
      ]);

      const data: VisitaImportData = {
        visita: { id: visitaId, fecha, fecha_fin: fechaFin },
        informe: {
          notas_generales: informe.notas_generales,
          empresas_presentes: informe.empresas_presentes,
          num_trabajadores: informe.num_trabajadores,
        },
        bloques: (bloquesRes.data || []).map((b: any) => ({
          categoria: b.categoria,
          estado: b.estado,
          anotaciones: b.anotaciones || [],
        })),
        incidencias: incidenciasRes.data || [],
        observaciones: observacionesRes.data || [],
      };

      onImport(data);

      const fechaStr = fechaFin
        ? new Date(fechaFin).toLocaleDateString('es-ES')
        : new Date(fecha).toLocaleDateString('es-ES');
      toast.success(`Datos importados desde la visita del ${fechaStr}`);
    } catch (err) {
      console.error(err);
      toast.error('Error al importar datos de la visita');
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async () => {
    setLoading(true);
    const list = await fetchVisitas();
    if (!list) {
      setLoading(false);
      return;
    }
    if (list.length === 0) {
      toast.error('No hay visitas finalizadas para esta obra');
      setLoading(false);
      return;
    }
    if (list.length === 1) {
      await importVisita(list[0].id, list[0].fecha, list[0].fecha_fin);
      return;
    }
    // Multiple visits — show selector
    setVisitas(list);
    setLoading(false);
    setOpen(true);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" onClick={handleClick} disabled={loading} className="gap-2">
          <Download className="h-4 w-4" />
          {loading ? 'Importando...' : 'Importar desde visita'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <p className="text-sm font-medium px-2 py-1 text-muted-foreground">Selecciona una visita</p>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {visitas.map((v) => {
            const fecha = v.fecha_fin
              ? new Date(v.fecha_fin).toLocaleDateString('es-ES')
              : new Date(v.fecha).toLocaleDateString('es-ES');
            return (
              <Button
                key={v.id}
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={() => importVisita(v.id, v.fecha, v.fecha_fin)}
              >
                Visita del {fecha}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
