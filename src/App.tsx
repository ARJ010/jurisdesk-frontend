import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { MockDBProvider } from '@/contexts/MockDBContext';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AdvocateLayout } from '@/components/layout/AdvocateLayout';
import { AdvocateDashboard } from '@/pages/advocate/AdvocateDashboard';
import { PersonalPayments } from '@/pages/advocate/PersonalPayments';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminDashboard } from '@/pages/admin/dashboard/AdminDashboard';
import { AdvocateList } from '@/pages/admin/advocates/AdvocateList';
import { AdvocateWorkspace } from '@/pages/admin/advocates/AdvocateWorkspace';
import { CollectionsLedger } from '@/pages/admin/reports/CollectionsLedger';
import { OutstandingLedger } from '@/pages/admin/reports/OutstandingLedger';
import { SettingsPage } from '@/pages/admin/settings/SettingsPage';
import { ErrorBoundary } from '@/components/system/ErrorBoundary';
import { ROUTES } from '@/config/routes';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  // Advocate Portal Layout
  {
    path: '/',
    element: (
      <ProtectedRoute requiredPermission="view_personal_profile">
        <AdvocateLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <AdvocateDashboard />,
      },
      {
        path: 'payments',
        element: <PersonalPayments />,
      },
    ],
  },
  // Admin/Staff Portal Layout
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredPermission="view_operational_dashboard">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <AdminDashboard />,
      },
      {
        path: 'advocates',
        element: <AdvocateList />,
      },
      {
        path: 'advocates/:id',
        element: <AdvocateWorkspace />,
      },
      {
        path: 'ledgers/collections',
        element: <CollectionsLedger />,
      },
      {
        path: 'ledgers/outstanding',
        element: <OutstandingLedger />,
      },
      {
        path: 'ledgers',
        element: <Navigate to="/admin/ledgers/collections" replace />,
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute requiredPermission="manage_settings">
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to={ROUTES.LOGIN} replace />,
  },
]);

function App() {
  return (
    <MockDBProvider>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </MockDBProvider>
  );
}

export default App;
