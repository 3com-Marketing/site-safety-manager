import { useAuth } from '@/lib/auth';
import { Shield, HardHat } from 'lucide-react';

export default function RoleSwitcher() {
  const { role, roles } = useAuth();

  if (roles.length <= 1) return null;

  const nextRole = role === 'admin' ? 'tecnico' : 'admin';
  const isAdmin = role === 'admin';

  const handleSwitch = () => {
    localStorage.setItem('preferred_role', nextRole);
    window.location.href = nextRole === 'admin' ? '/admin' : '/';
  };

  return (
    <button
      onClick={handleSwitch}
      className={`fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-50 flex items-center gap-2 rounded-full px-3 py-2 sm:px-4 sm:py-3 text-sm font-heading font-semibold shadow-lg transition-colors ${
        isAdmin
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-primary text-primary-foreground hover:bg-primary/90'
      }`}
    >
      {isAdmin ? <Shield className="h-4 w-4 sm:h-5 sm:w-5" /> : <HardHat className="h-4 w-4 sm:h-5 sm:w-5" />}
      <span className="hidden sm:inline">{isAdmin ? 'Admin' : 'Técnico'}</span>
      <span className="text-xs opacity-75">→ {nextRole}</span>
    </button>
  );
}
