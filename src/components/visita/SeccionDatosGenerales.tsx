import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mic, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useVoiceNote } from '@/hooks/useVoiceNote';
import VoiceNoteDialog from './VoiceNoteDialog';

interface Props {
  informeId: string;
  onBack: () => void;
  onSaved?: () => void;
}

export default function SeccionDatosGenerales({ informeId, onBack, onSaved }: Props) {
  const [numTrabajadores, setNumTrabajadores] = useState<number | ''>('');
  const [condiciones, setCondiciones] = useState('');
  const [empresas, setEmpresas] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeField, setActiveField] = useState<string>('');

  const voice = useVoiceNote('Datos generales de visita de obra');

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('informes')
        .select('num_trabajadores, condiciones_climaticas, empresas_presentes, notas_generales')
        .eq('id', informeId)
        .single();

      if (data) {
        setNumTrabajadores(data.num_trabajadores ?? '');
        setCondiciones(data.condiciones_climaticas ?? '');
        setEmpresas(data.empresas_presentes ?? '');
        setNotas(data.notas_generales ?? '');
      }
      setLoading(false);
    };
    fetch();
  }, [informeId]);

  const save = useCallback(async () => {
    setSaving(true);
    const { error } = await supabase.from('informes').update({
      num_trabajadores: numTrabajadores === '' ? null : numTrabajadores,
      condiciones_climaticas: condiciones,
      empresas_presentes: empresas,
      notas_generales: notas,
    }).eq('id', informeId);

    if (error) toast.error('Error al guardar');
    else toast.success('Datos guardados');
    setSaving(false);
  }, [informeId, numTrabajadores, condiciones, empresas, notas]);

  const openVoiceForField = (field: string) => {
    setActiveField(field);
    voice.openDialog();
  };

  const saveVoiceToField = () => {
    const text = voice.improvedText.trim();
    if (!text) return;

    switch (activeField) {
      case 'condiciones': setCondiciones(text); break;
      case 'empresas': setEmpresas(text); break;
      case 'notas': setNotas(text); break;
    }
    voice.closeDialog();
    toast.success('Texto añadido al campo');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-heading text-base font-semibold">Datos generales</h2>
      </div>

      <div className="space-y-4">
        {/* Num trabajadores */}
        <div className="space-y-2">
          <Label className="font-heading text-sm font-semibold">Nº Trabajadores en obra</Label>
          <Input
            type="number"
            value={numTrabajadores}
            onChange={(e) => setNumTrabajadores(e.target.value === '' ? '' : parseInt(e.target.value))}
            placeholder="Ej: 12"
            className="h-12 text-base"
            min={0}
          />
        </div>

        {/* Condiciones climáticas */}
        <div className="space-y-2">
          <Label className="font-heading text-sm font-semibold">Condiciones climáticas</Label>
          <button onClick={() => openVoiceForField('condiciones')} className="flex items-center justify-center gap-2 w-full h-14 rounded-xl bg-primary/10 text-primary text-base font-semibold active:bg-primary/20 transition-colors">
            <Mic className="h-6 w-6" />
            Dictar por voz
          </button>
          <Textarea
            value={condiciones}
            onChange={(e) => setCondiciones(e.target.value)}
            placeholder="Ej: Soleado, 25°C, sin viento"
            className="min-h-[80px] text-base"
          />
        </div>

        {/* Empresas presentes */}
        <div className="space-y-2">
          <Label className="font-heading text-sm font-semibold">Empresas presentes</Label>
          <button onClick={() => openVoiceForField('empresas')} className="flex items-center justify-center gap-2 w-full h-14 rounded-xl bg-primary/10 text-primary text-base font-semibold active:bg-primary/20 transition-colors">
            <Mic className="h-6 w-6" />
            Dictar por voz
          </button>
          <Textarea
            value={empresas}
            onChange={(e) => setEmpresas(e.target.value)}
            placeholder="Ej: Construcciones García, Electricidad López"
            className="min-h-[80px] text-base"
          />
        </div>

        {/* Notas generales */}
        <div className="space-y-2">
          <Label className="font-heading text-sm font-semibold">Notas generales</Label>
          <button onClick={() => openVoiceForField('notas')} className="flex items-center justify-center gap-2 w-full h-14 rounded-xl bg-primary/10 text-primary text-base font-semibold active:bg-primary/20 transition-colors">
            <Mic className="h-6 w-6" />
            Dictar por voz
          </button>
          <Textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Cualquier nota adicional sobre la visita..."
            className="min-h-[100px] text-base"
          />
        </div>

        <Button onClick={save} disabled={saving} className="h-14 w-full text-base font-bold gap-2">
          <Save className="h-5 w-5" />
          {saving ? 'Guardando...' : 'Guardar datos'}
        </Button>
      </div>

      <VoiceNoteDialog
        open={voice.showDialog}
        onOpenChange={(open) => { if (!open) voice.closeDialog(); }}
        dialogStep={voice.dialogStep}
        isRecording={voice.isRecording}
        rawTranscript={voice.rawTranscript}
        improvedText={voice.improvedText}
        onImprovedTextChange={voice.setImprovedText}
        onStartRecording={voice.startRecording}
        onStopRecording={voice.stopRecording}
        onFinishRecording={voice.finishRecording}
        onSave={saveVoiceToField}
        onRepeat={voice.openDialog}
      />
    </div>
  );
}
