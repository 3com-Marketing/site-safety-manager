import { ArrowLeft, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  titulo: string;
  onBack: () => void;
}

export default function SeccionPlaceholder({ titulo, onBack }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-heading text-base font-semibold">{titulo}</h2>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground">
        <Construction className="h-12 w-12" />
        <p className="text-sm font-medium">Próximamente</p>
        <p className="text-xs text-center max-w-xs">Esta sección estará disponible en la siguiente fase.</p>
      </div>
    </div>
  );
}
