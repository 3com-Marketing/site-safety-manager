import React, { Component, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h1 className="font-heading text-xl font-bold">Algo salió mal</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Ha ocurrido un error inesperado. Prueba a recargar la página.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Recargar
          </Button>
          <Button variant="outline" onClick={() => { window.location.href = '/'; }} className="gap-2">
            <Home className="h-4 w-4" /> Inicio
          </Button>
        </div>
      </div>
    );
  }
}
