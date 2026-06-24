import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useMockDB } from '@/contexts/MockDBContext';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/config/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
  const { currentUser, logout } = useMockDB();
  const location = useLocation();

  if (!currentUser) {
    // Save the attempted URL for redirecting back after login
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (requiredPermission && !currentUser.user_permissions.includes(requiredPermission)) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[60vh] bg-slate-50">
        <Card className="w-full max-w-md shadow-lg border-rose-100">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold font-heading text-slate-900 mt-4">
              Access Denied
            </h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
              Error 403 Forbidden
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-slate-600">
              Your account permissions do not allow you to access the page at{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 text-xs">
                {location.pathname}
              </code>.
            </p>
            <div className="pt-2 flex justify-center gap-4">
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
              <Button variant="danger" onClick={logout}>
                Log Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
