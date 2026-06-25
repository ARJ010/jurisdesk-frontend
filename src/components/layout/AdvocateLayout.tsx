import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMockDB } from '@/contexts/MockDBContext';
import { Scale, LogOut, User as UserIcon, CreditCard, Award, Settings, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ROUTES } from '@/config/routes';
import { PERMISSIONS } from '@/config/permissions';

export const AdvocateLayout: React.FC = () => {
  const { currentUser, logout, advocates } = useMockDB();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useKeyboardShortcuts();

  // Find if current user has advocate profile
  const advocate = advocates.find((a) => a.user_id === currentUser?.id);
  const hasAdvocateProfile = !!advocate;

  // Click outside listener for profile menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 shadow-sm relative z-40 print:hidden">
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-2.5">
          <Scale className="h-6 w-6 text-emerald-500" />
          <span className="text-lg font-bold font-heading text-slate-900 tracking-tight">
            JurisDesk
          </span>
        </div>

        {/* Center: Navigation Links */}
        <div className="flex items-center gap-1.5">
          <NavLink
            to={ROUTES.DASHBOARD}
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            My Dashboard
          </NavLink>
          <NavLink
            to={ROUTES.PAYMENTS}
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            My Payments
          </NavLink>
          {currentUser.user_permissions.includes(PERMISSIONS.VIEW_OPERATIONAL_DASHBOARD) && (
            <NavLink
              to={ROUTES.ADMIN}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              Admin Panel
            </NavLink>
          )}
        </div>

        {/* Right Side: Profile Info Dropdown */}
        <div className="flex items-center gap-4 relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-xl transition-all cursor-pointer text-left focus:outline-none"
          >
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm font-heading shadow-md">
              {currentUser.first_name[0]}{currentUser.last_name[0]}
            </div>
            <div className="hidden sm:block">
              <h4 className="text-sm font-semibold text-slate-800 leading-tight">
                {currentUser.first_name} {currentUser.last_name}
              </h4>
              <div className="flex items-center gap-1 mt-0.5">
                <UserIcon className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {currentUser.username}
                </span>
              </div>
            </div>
          </button>
          <Badge variant="paid">MEMBER</Badge>

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
                    Edit Profile
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
      </nav>

      {/* Main Content Body */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400 mt-auto bg-white shrink-0">
        <p>JurisDesk – Hosdurg Bar Association &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};
