import React from 'react';
import { NavLink } from 'react-router-dom';
import { useMockDB } from '@/contexts/MockDBContext';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Settings,
  Scale,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { PERMISSIONS } from '@/config/permissions';

export const AdminSidebar: React.FC = () => {
  const { currentUser } = useMockDB();

  if (!currentUser) return null;

  const links = [
    {
      to: ROUTES.ADMIN,
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      permission: PERMISSIONS.VIEW_OPERATIONAL_DASHBOARD,
    },
    {
      to: ROUTES.ADMIN_ADVOCATES,
      label: 'Advocate Registry',
      icon: <Users className="h-4 w-4" />,
      permission: PERMISSIONS.MANAGE_ADVOCATES,
    },
    {
      to: ROUTES.ADMIN_LEDGERS_COLLECTIONS,
      label: 'Collections Ledger',
      icon: <Receipt className="h-4 w-4" />,
      permission: PERMISSIONS.VIEW_REPORTS,
    },
    {
      to: ROUTES.ADMIN_LEDGERS_OUTSTANDING,
      label: 'Outstanding Arrears',
      icon: <Receipt className="h-4 w-4" />,
      permission: PERMISSIONS.VIEW_REPORTS,
    },
    {
      to: ROUTES.ADMIN_SETTINGS,
      label: 'System Settings',
      icon: <Settings className="h-4 w-4" />,
      permission: PERMISSIONS.MANAGE_SETTINGS,
    },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center border-b border-slate-800 gap-2.5">
        <Scale className="h-6 w-6 text-emerald-500" />
        <span className="text-lg font-bold font-heading text-white tracking-tight">
          JurisDesk
        </span>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1.5">
        {links.map((link) => {
          // Verify permission check
          if (!currentUser.user_permissions.includes(link.permission)) {
            return null;
          }

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === ROUTES.ADMIN}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'hover:bg-slate-800/50 hover:text-slate-100'
                }`
              }
            >
              {link.icon}
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Branding */}
      <div className="p-4 border-t border-slate-800 text-center">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
          Hosdurg Bar Assoc.
        </p>
      </div>
    </div>
  );
};
