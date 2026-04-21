import { ChevronRight, ClipboardCheck, AlertTriangle, FileText, Eye, Info } from 'lucide-react';

const SECCIONES = [
  { id: 'datos_generales', label: 'Datos generales', icon: Info, color: 'text-accent' },
  { id: 'checklist', label: 'Checklist', icon: ClipboardCheck, color: 'text-primary' },
  { id: 'incidencias', label: 'Incidencias', icon: AlertTriangle, color: 'text-warning' },
  { id: 'amonestaciones', label: 'Amonestaciones', icon: FileText, color: 'text-destructive' },
  { id: 'observaciones', label: 'Observaciones', icon: Eye, color: 'text-muted-foreground' },
] as const;

export type SeccionId = typeof SECCIONES[number]['id'];

interface Props {
  onSelect: (seccion: SeccionId) => void;
  checklistCount?: number;
  incidenciasCount?: number;
  amonestacionesCount?: number;
  observacionesCount?: number;
}

export default function VisitaSecciones({
  onSelect,
  checklistCount = 0,
  incidenciasCount = 0,
  amonestacionesCount = 0,
  observacionesCount = 0,
}: Props) {
  const getBadge = (id: SeccionId) => {
    if (id === 'checklist' && checklistCount > 0) return checklistCount;
    if (id === 'incidencias' && incidenciasCount > 0) return incidenciasCount;
    if (id === 'amonestaciones' && amonestacionesCount > 0) return amonestacionesCount;
    if (id === 'observaciones' && observacionesCount > 0) return observacionesCount;
    return null;
  };

  return (
    <div className="space-y-2">
      <h2 className="font-heading text-base font-semibold">Secciones</h2>
      <div className="space-y-2">
        {SECCIONES.map((sec) => {
          const Icon = sec.icon;
          const badge = getBadge(sec.id);
          return (
            <button
              key={sec.id}
              onClick={() => onSelect(sec.id)}
              className="flex w-full items-center gap-3 sm:gap-4 rounded-2xl border-2 border-border bg-card p-4 sm:p-5 text-left transition-all active:scale-[0.98] hover:border-primary/40 hover:shadow-md"
            >
              <div className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-muted ${sec.color}`}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <span className="flex-1 font-heading text-sm sm:text-base font-semibold">{sec.label}</span>
              {badge != null && (
                <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {badge}
                </span>
              )}
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
