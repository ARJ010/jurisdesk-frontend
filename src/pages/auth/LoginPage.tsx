import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthService } from '@/hooks/useAuthService';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Scale, ShieldAlert } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { PERMISSIONS } from '@/config/permissions';

export const LoginPage: React.FC = () => {
  const { login, currentUser } = useAuthService();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch the attempted page redirect or fallback to default dashboards
  const from = location.state?.from?.pathname;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all credential fields.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const user = await login(username.trim(), password.trim());
      if (user) {
        // Successful login, determine redirect based on permissions
        if (from) {
          navigate(from, { replace: true });
        } else if (user.user_permissions.includes(PERMISSIONS.VIEW_OPERATIONAL_DASHBOARD)) {
          navigate(ROUTES.ADMIN, { replace: true });
        } else {
          navigate(ROUTES.DASHBOARD, { replace: true });
        }
      } else {
        setError('Authentication failed. Please verify enrolment/mobile number and password.');
      }
    } catch (err) {
      setError('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to speed up demo reviews
  const handleQuickFill = (userType: 'admin' | 'staff' | 'advocate') => {
    setError(null);
    if (userType === 'admin') {
      setUsername('admin');
      setPassword('pass@123');
    } else if (userType === 'staff') {
      setUsername('staff');
      setPassword('pass@123');
    } else {
      setUsername('K/876/2017');
      setPassword('pass@123');
    }
  };

  // If already logged in, redirect away
  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.user_permissions.includes(PERMISSIONS.VIEW_OPERATIONAL_DASHBOARD)) {
        navigate(ROUTES.ADMIN, { replace: true });
      } else {
        navigate(ROUTES.DASHBOARD, { replace: true });
      }
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative">
      {/* Visual background accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-500/10 rounded-full blur-3xl" />

      <Card className="w-full max-w-md shadow-2xl border-slate-800 bg-slate-950 relative z-10 p-2">
        <CardHeader className="text-center flex-col items-center pt-8 border-b-0">
          <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-500 shadow-sm">
            <Scale className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-white mt-4 tracking-tight">
            JurisDesk Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 uppercase tracking-widest font-medium">
            Hosdurg Bar Association
          </p>
        </CardHeader>

        <CardContent className="px-6 py-4">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <Input
              label="Username (Mobile or Enrolment Number)"
              placeholder="e.g. K/876/2017 or admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-slate-900 border-slate-800 text-slate-200 focus:ring-emerald-500"
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-900 border-slate-800 text-slate-200 focus:ring-emerald-500"
              disabled={loading}
            />

            {error && (
              <div className="bg-rose-950/40 border border-rose-900 text-rose-300 text-xs p-3 rounded-lg flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="secondary"
              className="w-full h-10 mt-2 font-semibold"
              isLoading={loading}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Fill Demo Section */}
          <div className="mt-8 pt-6 border-t border-slate-900">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              Developer Quick-Fill Credentials
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 py-1.5 px-2 rounded border border-slate-800 font-medium transition-colors cursor-pointer"
              >
                Haridasan (Admin)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('staff')}
                className="bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 py-1.5 px-2 rounded border border-slate-800 font-medium transition-colors cursor-pointer"
              >
                Bindu (Staff)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('advocate')}
                className="bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 py-1.5 px-2 rounded border border-slate-800 font-medium transition-colors cursor-pointer"
              >
                Sandeep (Adv.)
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="text-center border-t-0 pb-6">
          <p className="text-[10px] text-slate-500 w-full">
            Secured ledger platform. Access restricted to bar members.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
