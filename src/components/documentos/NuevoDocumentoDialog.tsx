import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDocumentosObra } from '@/hooks/useDocumentosObra';
import { TIPO_DOCUMENTO_LABELS, TIPO_DOCUMENTO_ROL, type TipoDocumento } from '@/types/documentos';
import { useAuth } from '@/lib/auth';
import FormActaNombramiento from './formularios/FormActaNombramiento';
import FormActaAprobacion from './formularios/FormActaAprobacion';
import FormActaReunion from './formularios/FormActaReunion';
import FormInforme from './formularios/FormInforme';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obraId: string;
  onCreated: () => void;
}

const FORM_MAP: Record<string, React.ComponentType<any>> = {
  acta_nombramiento_cae: FormActaNombramiento,
  acta_nombramiento_proyecto: FormActaNombramiento,
  acta_aprobacion_dgpo: FormActaAprobacion,
  acta_aprobacion_plan_sys: FormActaAprobacion,
  acta_reunion_cae: FormActaReunion,
  acta_reunion_inicial: FormActaReunion,
  acta_reunion_sys: FormActaReunion,
  informe_css: FormInforme,
  informe_at: FormInforme,
};

interface Categoria {
  label: string;
  roles: Array<'admin' | 'tecnico'>;
  tipos: TipoDocumento[];
}

const CATEGORIAS: Categoria[] = [
  {
    label: 'Nombramientos',
    roles: ['admin'],
    tipos: ['acta_nombramiento_cae', 'acta_nombramiento_proyecto'],
  },
  {
    label: 'Aprobaciones',
    roles: ['admin'],
    tipos: ['acta_aprobacion_dgpo', 'acta_aprobacion_plan_sys'],
  },
  {
    label: 'Reuniones',
    roles: ['admin', 'tecnico'],
    tipos: ['acta_reunion_cae', 'acta_reunion_inicial', 'acta_reunion_sys'],
  },
  {
    label: 'Informes',
    roles: ['admin', 'tecnico'],
    tipos: ['informe_css', 'informe_at'],
  },
];

export default function NuevoDocumentoDialog({ open, onOpenChange, obraId, onCreated }: Props) {
  const [paso, setPaso] = useState<1 | 2>(1);
  const [tipo, setTipo] = useState<string>('');
  const { crearDocumento } = useDocumentosObra(obraId);
  const { role } = useAuth();

  // Pre-fill queries
  const { data: obra } = useQuery({
    queryKey: ['obra-detalle', obraId],
    queryFn: async () => {
      const { data } = await supabase
        .from('obras')
        .select('*, clientes(*)')
        .eq('id', obraId)
        .single();
      return data;
    },
    enabled: !!obraId && open,
  });

  const { data: tecnicoAsignado } = useQuery({
    queryKey: ['tecnico-obra', obraId],
    queryFn: async () => {
      const { data } = await supabase
        .from('tecnicos_obras')
        .select('*, tecnicos(*)')
        .eq('obra_id', obraId)
        .limit(1)
        .maybeSingle();
      return (data as any)?.tecnicos ?? null;
    },
    enabled: !!obraId && open,
  });

  const defaultValues = useMemo(() => {
    const vals: Record<string, string> = {};
    if (obra) {
      vals.nombre_obra = (obra as any).nombre || '';
      vals.direccion_obra = (obra as any).direccion || '';
      const cliente = (obra as any).clientes;
      if (cliente) {
        vals.nombre_promotor = cliente.nombre || '';
        vals.cif_promotor = cliente.cif || '';
        vals.domicilio_promotor = cliente.ciudad || '';
      }
    }
    if (tecnicoAsignado) {
      vals.nombre_coordinador = tecnicoAsignado.nombre || '';
      vals.email_coordinador = tecnicoAsignado.email || '';
      vals.movil_coordinador = tecnicoAsignado.telefono || '';
      vals.nombre_tecnico = tecnicoAsignado.nombre || '';
    }
    return vals;
  }, [obra, tecnicoAsignado]);

  const categoriasVisibles = CATEGORIAS.filter(cat =>
    role === 'admin' || cat.roles.includes(role as 'tecnico')
  );

  const FormComponent = tipo ? FORM_MAP[tipo] : null;

  const handleSave = async (data: Record<string, any>) => {
    const { _asistentes, _actividades, _empresas, ...datos } = data;
    await crearDocumento.mutateAsync({
      tipo: tipo as any,
      datos,
      asistentes: _asistentes,
      actividades: _actividades,
      empresas: _empresas,
    });
    onOpenChange(false);
    resetState();
    onCreated();
  };

  const resetState = () => {
    setPaso(1);
    setTipo('');
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) resetState();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {paso === 1 ? 'Nuevo documento — Elegir tipo' : `Nuevo: ${TIPO_DOCUMENTO_LABELS[tipo as TipoDocumento]}`}
          </DialogTitle>
        </DialogHeader>

        {paso === 1 && (
          <div className="space-y-6">
            {categoriasVisibles.map(cat => (
              <div key={cat.label} className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">{cat.label}</p>
                <div className="grid grid-cols-2 gap-2">
                  {cat.tipos
                    .filter(t => {
                      const rolTipo = TIPO_DOCUMENTO_ROL[t];
                      return rolTipo === 'ambos' || rolTipo === role;
                    })
                    .map(t => (
                      <button
                        key={t}
                        onClick={() => setTipo(t)}
                        className={`rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                          tipo === t
                            ? 'border-primary bg-primary/10 font-medium'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {TIPO_DOCUMENTO_LABELS[t]}
                      </button>
                    ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setPaso(2)} disabled={!tipo} className="gap-2">
                Siguiente <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {paso === 2 && FormComponent && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setPaso(1)} className="gap-1 -ml-2">
              <ArrowLeft className="h-4 w-4" /> Cambiar tipo
            </Button>
            <FormComponent
              obraId={obraId}
              tipo={tipo}
              onSave={handleSave}
              saving={crearDocumento.isPending}
              defaultValues={defaultValues}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
