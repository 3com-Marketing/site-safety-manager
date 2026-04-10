import { ChevronRight, ShieldCheck, Trash2, Mountain, SignpostBig, Cog, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BLOQUES = [
  { value: 'EPIs', label: 'EPIs', icon: ShieldCheck },
  { value: 'orden_limpieza', label: 'Orden y limpieza', icon: Trash2 },
  { value: 'altura', label: 'Trabajo en altura', icon: Mountain },
  { value: 'señalizacion', label: 'Señalización', icon: SignpostBig },
  { value: 'maquinaria', label: 'Maquinaria', icon: Cog },
] as const;

export type BloqueCategoria = typeof BLOQUES[number]['value'];

interface BloqueEstado {
  categoria: string;
  anotacionesCount: number;
}

interface Props {
  bloqueEstados: BloqueEstado[];
  onSelectBloque: (categoria: BloqueCategoria) => void;
  onBack: () => void;
}

export default function ChecklistSection({ bloqueEstados, onSelectBloque, onBack }: Props) {
  const getEstado = (cat: string) => bloqueEstados.find(b => b.categoria === cat);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-heading text-base font-semibold">Checklist</h2>
      </div>

      <div className="space-y-2">
        {BLOQUES.map((bloque) => {
          const Icon = bloque.icon;
          const est = getEstado(bloque.value);
          const count = est?.anotacionesCount || 0;

          return (
            <button
              key={bloque.value}
              onClick={() => onSelectBloque(bloque.value)}
              className="flex w-full items-center gap-4 rounded-2xl border-2 border-border bg-card p-5 text-left transition-all active:scale-[0.98] hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-heading text-base font-semibold block">{bloque.label}</span>
                {count > 0 && (
                  <span className="text-xs text-muted-foreground">{count} anotación{count !== 1 ? 'es' : ''}</span>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
