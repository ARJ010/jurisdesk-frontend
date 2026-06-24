import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export const AdminLayout: React.FC = () => {
  useKeyboardShortcuts();

  return (
    <div className="flex min-h-screen bg-slate-50 w-full overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
