import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Login() {
  const { signIn, session, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [success, setSuccess] = useState('');

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Cargando...</p></div>;
  if (session) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Cuenta creada. Iniciando sesión...');
        await signIn(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">SafeWork</h1>
          <p className="text-sm text-muted-foreground">Seguridad y salud en obras</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="h-12 text-base"
          />
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-12 text-base"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <Button type="submit" disabled={submitting} className="h-12 w-full text-base font-semibold">
            {submitting ? (isSignUp ? 'Creando cuenta...' : 'Entrando...') : (isSignUp ? 'Crear cuenta' : 'Iniciar sesión')}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }} className="text-primary font-medium hover:underline">
            {isSignUp ? 'Iniciar sesión' : 'Registrarse'}
          </button>
        </p>
      </div>
    </div>
  );
}
