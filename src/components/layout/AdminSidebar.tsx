import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useMockDB } from '@/contexts/MockDBContext';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Settings,
  Scale,
  UserCheck,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { PERMISSIONS } from '@/config/permissions';

export const AdminSidebar: React.FC = () => {
  const { currentUser } = useMockDB();
  const location = useLocation();

  if (!currentUser) return null;

  const operationalLinks = [
    {
      to: ROUTES.ADMIN,
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      permission: PERMISSIONS.VIEW_OPERATIONAL_DASHBOARD,
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
      to: ROUTES.ADMIN_PAYMENT_REQUESTS,
      label: 'Payment Requests',
      icon: <Receipt className="h-4 w-4" />,
      permission: PERMISSIONS.COLLECT_PAYMENTS,
    },
  ];

  const adminLinks = [
    {
      to: ROUTES.ADMIN_ADVOCATES,
      label: 'Advocate Registry',
      icon: <Users className="h-4 w-4" />,
      permission: PERMISSIONS.MANAGE_ADVOCATES,
    },
    {
      to: '/admin/staff',
      label: 'Staff Directory',
      icon: <UserCheck className="h-4 w-4" />,
      permission: PERMISSIONS.MANAGE_SETTINGS,
    },
    {
      to: ROUTES.ADMIN_SETTINGS,
      label: 'System Settings',
      icon: <Settings className="h-4 w-4" />,
      permission: PERMISSIONS.MANAGE_SETTINGS,
    },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen border-r border-slate-800 shrink-0 print:hidden">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center border-b border-slate-800 gap-2.5">
        <Scale className="h-6 w-6 text-emerald-500" />
        <span className="text-lg font-bold font-heading text-white tracking-tight">
          JurisDesk
        </span>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-6">
        {/* Operations Category */}
        <div className="space-y-1">
          <h5 className="px-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-heading">
            Operations
          </h5>
          {operationalLinks.map((link) => {
            if (!currentUser.user_permissions.includes(link.permission)) {
              return null;
            }

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === ROUTES.ADMIN}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-155 ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm font-semibold'
                      : 'hover:bg-slate-800/50 hover:text-slate-100 text-slate-400'
                  }`
                }
              >
                {link.icon}
                {link.label}
              </NavLink>
            );
          })}
        </div>

        {/* Administration Category */}
        <div className="space-y-1">
          <h5 className="px-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-heading">
            Administration
          </h5>
          {adminLinks.map((link) => {
            if (!currentUser.user_permissions.includes(link.permission)) {
              return null;
            }

            let isActive = false;

            if (link.to.includes('?')) {
              const [basePath, queryStr] = link.to.split('?');
              const paramName = queryStr.split('=')[0];
              const paramVal = queryStr.split('=')[1];
              const urlParams = new URLSearchParams(location.search);
              
              isActive = location.pathname === basePath && urlParams.get(paramName) === paramVal;
            } else {
              isActive = location.pathname === link.to;
            }

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-155 ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm font-semibold'
                    : 'hover:bg-slate-800/50 hover:text-slate-100 text-slate-400'
                }`}
              >
                {link.icon}
                {link.label}
              </NavLink>
            );
          })}
        </div>
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
