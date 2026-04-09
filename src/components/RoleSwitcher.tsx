import { useAuth } from '@/lib/auth';
import { Shield, HardHat } from 'lucide-react';

export default function RoleSwitcher() {
  const { role, roles, switchRole } = useAuth();

  if (roles.length <= 1) return null;

  const nextRole = role === 'admin' ? 'tecnico' : 'admin';
  const isAdmin = role === 'admin';

  return (
    <button
      onClick={() => switchRole(nextRole)}
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
