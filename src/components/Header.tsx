import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, FileText, Plus } from 'lucide-react';

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-foreground">QuickForm Pro</span>
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
              <Button size="sm" onClick={() => navigate('/form/new')} className="gradient-primary text-primary-foreground border-0">
                <Plus className="h-4 w-4 mr-1" />
                New Form
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                Log in
              </Button>
              <Button size="sm" onClick={() => navigate('/auth')} className="gradient-primary text-primary-foreground border-0">
                Sign up
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
