import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, Scale } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  categoria: string;
  saving?: boolean;
  /** Optional: receive normativa returned by the AI */
  onNormativaUpdate?: (normativa: string) => void;
  /** Compact mode used inside admin pages where the parent already saves on a global button */
  compact?: boolean;
}

export default function EditableTextWithAI({
  value,
  onChange,
  onSave,
  onCancel,
  categoria,
  saving,
  onNormativaUpdate,
  compact,
}: Props) {
  const [isImproving, setIsImproving] = useState(false);
  const [normativa, setNormativa] = useState('');

  const improve = async () => {
    if (!value.trim()) {
      toast.error('No hay texto que mejorar');
      return;
    }
    setIsImproving(true);
    try {
      const { data, error } = await supabase.functions.invoke('mejorar-texto', {
        body: { texto: value, categoria },
      });
      if (error) {
        const status = (error as any)?.context?.status;
        if (status === 429) toast.error('Demasiadas solicitudes. Inténtalo en unos segundos.');
        else if (status === 402) toast.error('Créditos de IA agotados.');
        else toast.error('No se pudo mejorar el texto.');
      } else if (data?.texto_mejorado) {
        onChange(data.texto_mejorado);
        if (data.normativa) {
          setNormativa(data.normativa);
          onNormativaUpdate?.(data.normativa);
        }
        toast.success('Texto mejorado con IA');
      }
    } catch (e) {
      console.error(e);
      toast.error('Sin conexión. El texto original se mantiene.');
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={compact ? 'text-sm min-h-[60px]' : 'min-h-[80px] text-sm'}
        disabled={isImproving}
      />
      {normativa && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Scale className="h-3 w-3 text-primary" />
            <p className="text-[10px] font-semibold text-primary">Normativa sugerida</p>
          </div>
          <p className="text-xs text-muted-foreground whitespace-pre-line">{normativa}</p>
        </div>
      )}
      {compact ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={improve}
          disabled={isImproving || !value.trim()}
          className="gap-2"
        >
          {isImproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isImproving ? 'Mejorando...' : 'Mejorar con IA'}
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <Button size="sm" onClick={onSave} disabled={saving || isImproving} className="w-full">
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={improve}
              disabled={isImproving || !value.trim()}
              className="flex-1 gap-2"
            >
              {isImproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isImproving ? 'Mejorando...' : 'Mejorar con IA'}
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel} disabled={isImproving} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
