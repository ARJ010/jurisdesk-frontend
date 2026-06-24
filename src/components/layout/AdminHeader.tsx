import React, { useState, useEffect, useRef } from 'react';
import { useMockDB } from '@/contexts/MockDBContext';
import { useReportService } from '@/hooks/useReportService';
import { Search, Bell, LogOut, Shield, User as UserIcon, CreditCard, Award, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { PERMISSIONS } from '@/config/permissions';

export const AdminHeader: React.FC = () => {
  const { currentUser, logout, advocates } = useMockDB();
  const { getOperationalNotifications } = useReportService();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const alerts = getOperationalNotifications();

  // Find if current user has advocate profile
  const advocate = advocates.find((a) => a.user_id === currentUser?.id);
  const hasAdvocateProfile = !!advocate;

  // Keyboard shortcut listener for focusing search (/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener for closing panels
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 shadow-sm relative z-40">
      {/* Search Input Container */}
      <div className="w-96 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          ref={searchRef}
          id="global-search"
          type="text"
          placeholder="Search advocates... (Press / to focus)"
          className="w-full h-10 pl-10 pr-12 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-400 font-semibold uppercase pointer-events-none">
          /
        </kbd>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-6">
        {/* Notification bell */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors relative cursor-pointer"
          >
            <Bell className="h-5 w-5" />
            {alerts.length > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-rose-600 text-[10px] text-white font-bold rounded-full flex items-center justify-center animate-pulse">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Operational Alerts
                </h3>
                <Badge variant="warning">{alerts.length} Warnings</Badge>
              </div>

              {alerts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No pending system issues or alerts.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2.5">
                  {alerts.map((alert) => {
                    const alertVariants = {
                      arrears: 'border-rose-200 bg-rose-50/50 text-rose-800',
                      compliance: 'border-amber-200 bg-amber-50/50 text-amber-800',
                      billing: 'border-indigo-200 bg-indigo-50/50 text-indigo-800',
                      reconciliation: 'border-slate-200 bg-slate-50/50 text-slate-800',
                    };

                    return (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-lg border text-xs leading-relaxed transition-all ${
                          alertVariants[alert.type]
                        }`}
                      >
                        <p className="font-medium">{alert.text}</p>
                        {alert.link && (
                          <button
                            onClick={() => {
                              setShowNotifications(false);
                              navigate(alert.link!);
                            }}
                            className="inline-block mt-1 font-bold hover:underline cursor-pointer text-left"
                          >
                            Resolve Issue &rarr;
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Info & Profile Dropdown */}
        <div className="flex items-center gap-4 border-l border-slate-200 pl-6 relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-xl transition-all cursor-pointer text-left focus:outline-none"
          >
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm font-heading shadow-md">
              {currentUser.first_name[0]}{currentUser.last_name[0]}
            </div>
            <div className="hidden sm:block">
              <h4 className="text-xs font-semibold text-slate-800 leading-tight">
                {currentUser.first_name} {currentUser.last_name}
              </h4>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className="h-3 w-3 text-slate-400" />
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                  {currentUser.groups.join(', ')}
                </span>
              </div>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 space-y-1 text-slate-700">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900">
                  {currentUser.first_name} {currentUser.last_name}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {currentUser.email}
                </p>
                {hasAdvocateProfile && (
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                    Roll No: {advocate?.enrolment_no}
                  </p>
                )}
              </div>
              
              {hasAdvocateProfile && (
                <>
                  <div className="px-2.5 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Personal Workspace
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate(ROUTES.DASHBOARD);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium cursor-pointer text-left"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                    My Dashboard
                  </button>
                  {/* Navigates to dashboard and opens the Edit Personal Profile modal */}
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate(ROUTES.DASHBOARD + '?edit_profile=true');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium cursor-pointer text-left"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate(ROUTES.PAYMENTS);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium cursor-pointer text-left"
                  >
                    <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                    My Payments
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate(ROUTES.DASHBOARD);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium cursor-pointer text-left"
                  >
                    <Award className="h-3.5 w-3.5 text-slate-400" />
                    My Certificates
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                </>
              )}

              {currentUser.user_permissions.includes(PERMISSIONS.VIEW_OPERATIONAL_DASHBOARD) && (
                <>
                  <div className="px-2.5 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Administrative
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate(ROUTES.ADMIN);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium cursor-pointer text-left"
                  >
                    <Shield className="h-3.5 w-3.5 text-slate-400" />
                    Admin Dashboard
                  </button>
                  {currentUser.user_permissions.includes(PERMISSIONS.MANAGE_SETTINGS) && (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate(ROUTES.ADMIN_SETTINGS);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium cursor-pointer text-left"
                    >
                      <Settings className="h-3.5 w-3.5 text-slate-400" />
                      Settings
                    </button>
                  )}
                  <div className="border-t border-slate-100 my-1"></div>
                </>
              )}

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 transition-colors font-semibold cursor-pointer text-left"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
