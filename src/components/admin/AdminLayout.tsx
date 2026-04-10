import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, FileText, Users, Building2, HardHat } from 'lucide-react';

const TABS = [
  { path: '/admin', label: 'Dashboard', icon: FileText },
  { path: '/admin/clientes', label: 'Clientes', icon: Building2 },
  { path: '/admin/obras', label: 'Obras', icon: HardHat },
  { path: '/admin/tecnicos', label: 'Técnicos', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold">SafeWork Admin</h1>
              <p className="text-xs text-muted-foreground">Panel de administración</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        <nav className="mt-4 flex gap-2 flex-wrap">
          {TABS.map(tab => {
            const active = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>
      <div className="mx-auto max-w-7xl p-6">
        {children}
      </div>
    </div>
  );
}
