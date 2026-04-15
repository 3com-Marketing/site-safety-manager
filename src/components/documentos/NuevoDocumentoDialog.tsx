import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TIPO_LABELS, useDocumentosObra } from '@/hooks/useDocumentosObra';
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

export default function NuevoDocumentoDialog({ open, onOpenChange, obraId, onCreated }: Props) {
  const [tipo, setTipo] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const { createDocumento } = useDocumentosObra();

  const FormComponent = tipo ? FORM_MAP[tipo] : null;

  const handleSave = async (data: Record<string, any>) => {
    setSaving(true);
    const result = await createDocumento({ ...data, obra_id: obraId, tipo: tipo as any });
    setSaving(false);
    if (result) {
      onOpenChange(false);
      setTipo('');
      onCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={open => { onOpenChange(open); if (!open) setTipo(''); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo documento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de documento</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {FormComponent && <FormComponent obraId={obraId} tipo={tipo} onSave={handleSave} saving={saving} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
