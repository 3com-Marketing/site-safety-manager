import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Shield, HardHat } from 'lucide-react';

export default function RoleSwitcher() {
  const { role, roles, switchRole } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (roles.length <= 1) return null;

  const nextRole = role === 'admin' ? 'tecnico' : 'admin';
  const isAdmin = role === 'admin';

  const handleSwitch = () => {
    queryClient.clear();
    switchRole(nextRole);
    navigate(nextRole === 'admin' ? '/admin' : '/', { replace: true });
  };

  return (
    <button
      onClick={handleSwitch}
      className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-heading font-semibold shadow-lg transition-colors ${
        isAdmin
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-primary text-primary-foreground hover:bg-primary/90'
      }`}
    >
      {isAdmin ? <Shield className="h-5 w-5" /> : <HardHat className="h-5 w-5" />}
      {isAdmin ? 'Admin' : 'Técnico'}
      <span className="text-xs opacity-75">→ {nextRole}</span>
    </button>
  );
}
