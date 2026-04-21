import { ChevronRight, Info, ShieldCheck, Trash2, Mountain, SignpostBig, Cog, AlertTriangle, FileText, Eye, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const SECCIONES = [
  { id: 'datos_generales', label: 'Datos generales', icon: Info },
  { id: 'bloque_EPIs', label: 'EPIs', icon: ShieldCheck },
  { id: 'bloque_orden_limpieza', label: 'Orden y limpieza', icon: Trash2 },
  { id: 'bloque_altura', label: 'Trabajo en altura', icon: Mountain },
  { id: 'bloque_señalizacion', label: 'Señalización', icon: SignpostBig },
  { id: 'bloque_maquinaria', label: 'Maquinaria', icon: Cog },
  { id: 'incidencias', label: 'Incidencias', icon: AlertTriangle },
  { id: 'amonestaciones', label: 'Amonestaciones', icon: FileText },
  { id: 'observaciones', label: 'Observaciones', icon: Eye },
] as const;

export type SeccionId = typeof SECCIONES[number]['id'];

interface Props {
  onSelect: (seccion: SeccionId) => void;
  completadas: Record<string, boolean>;
}

export default function VisitaSecciones({ onSelect, completadas }: Props) {
  const completedCount = SECCIONES.filter(s => completadas[s.id]).length;
  const progress = Math.round((completedCount / SECCIONES.length) * 100);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold text-muted-foreground">Progreso de la visita</h2>
          <span className="text-xs font-semibold text-muted-foreground">{completedCount} de {SECCIONES.length}</span>
        </div>
        <Progress value={progress} className="h-2.5" />
      </div>

      <div className="space-y-2">
        {SECCIONES.map((sec) => {
          const Icon = sec.icon;
          const done = completadas[sec.id] || false;
          return (
            <button
              key={sec.id}
              onClick={() => onSelect(sec.id)}
              className="flex w-full items-center gap-3 sm:gap-4 rounded-2xl border-2 border-border bg-card p-4 sm:p-5 text-left transition-all active:scale-[0.98] hover:border-primary/40 hover:shadow-md"
            >
              <div className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl ${done ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <span className="flex-1 font-heading text-sm sm:text-base font-semibold">{sec.label}</span>
              {done ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Completado
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Sin completar</span>
              )}
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
