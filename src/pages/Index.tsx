import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import TechHome from './TechHome';
import AdminInformes from './AdminInformes';

export default function Index() {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground font-heading">Cargando...</p>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  if (role === 'admin') return <AdminInformes />;
  return <TechHome />;
}
