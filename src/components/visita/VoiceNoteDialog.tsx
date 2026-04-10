import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';
import type { VoiceDialogStep } from '@/hooks/useVoiceNote';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dialogStep: VoiceDialogStep;
  isRecording: boolean;
  rawTranscript: string;
  improvedText: string;
  onImprovedTextChange: (text: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFinishRecording: () => void;
  onSave: () => void;
  onRepeat: () => void;
}

export default function VoiceNoteDialog({
  open,
  onOpenChange,
  dialogStep,
  isRecording,
  rawTranscript,
  improvedText,
  onImprovedTextChange,
  onStartRecording,
  onStopRecording,
  onFinishRecording,
  onSave,
  onRepeat,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {dialogStep === 'recording' && 'Grabar nota de voz'}
            {dialogStep === 'improving' && 'Mejorando texto...'}
            {dialogStep === 'editing' && 'Revisar nota'}
          </DialogTitle>
        </DialogHeader>

        {dialogStep === 'recording' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-4">
              <button
                onClick={isRecording ? onStopRecording : onStartRecording}
                className={`flex h-20 w-20 items-center justify-center rounded-full transition-all active:scale-95 ${
                  isRecording
                    ? 'bg-destructive text-destructive-foreground animate-pulse'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
              </button>
              <p className="text-sm text-muted-foreground text-center">
                {isRecording ? 'Escuchando... Pulsa para detener' : 'Pulsa para empezar a hablar'}
              </p>
            </div>

            {rawTranscript && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-1">Transcripción:</p>
                <p className="text-sm">{rawTranscript}</p>
              </div>
            )}

            <Button
              onClick={onFinishRecording}
              disabled={!rawTranscript.trim()}
              className="h-12 w-full text-base font-semibold gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Mejorar con IA
            </Button>
          </div>
        )}

        {dialogStep === 'improving' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Procesando con IA...</p>
          </div>
        )}

        {dialogStep === 'editing' && (
          <div className="space-y-4">
            {rawTranscript !== improvedText && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-1">Texto original:</p>
                <p className="text-xs text-muted-foreground italic">{rawTranscript}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground mb-2">Resultado (editable):</p>
              <Textarea
                value={improvedText}
                onChange={(e) => onImprovedTextChange(e.target.value)}
                className="min-h-[120px] text-base"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={onSave}
                disabled={!improvedText.trim()}
                className="h-12 flex-1 text-base font-semibold"
              >
                Guardar nota
              </Button>
              <Button variant="outline" onClick={onRepeat} className="h-12">
                Repetir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
