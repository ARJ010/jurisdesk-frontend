import React, { useState, useEffect } from 'react';
import { useMockDB } from '@/contexts/MockDBContext';
import { useEmployeeService } from '@/hooks/useEmployeeService';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StaffRegistrationWizard } from './StaffRegistrationWizard';
import {
  Search,
  Plus,
  Shield,
  Key,
  Calendar,
  Phone,
  Mail,
  X,
  Clipboard,
  CheckCircle,
  Eye,
  Edit,
  UserMinus,
  Briefcase
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { EmployeeProfile } from '@/types';
import { Input } from '@/components/ui/Input';

export const StaffDirectory: React.FC = () => {
  const { employeeProfiles, users, activityLogs } = useMockDB();
  const {
    updateEmployee,
    disableEmployee,
    enableEmployee,
    retireEmployee,
    resetEmployeePassword
  } = useEmployeeService();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Dialog & Modal states
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null);
  const [tempPasswordAlert, setTempPasswordAlert] = useState<{ name: string; pass: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Handle direct navigation via global search parameter `?id=uuid`
  useEffect(() => {
    const directId = searchParams.get('id');
    if (directId) {
      const emp = employeeProfiles.find(e => e.id === directId);
      if (emp) {
        setSelectedEmployee(emp);
      }
    }
  }, [searchParams, employeeProfiles]);

  // Filter staff profiles
  const filteredEmployees = employeeProfiles.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      emp.full_name.toLowerCase().includes(q) ||
      emp.employee_code.toLowerCase().includes(q) ||
      emp.designation.toLowerCase().includes(q) ||
      emp.mobile.includes(q) ||
      emp.email.toLowerCase().includes(q)
    );
  });

  const handleEditClick = (emp: EmployeeProfile) => {
    setEditingEmployee(emp);
    setEditName(emp.full_name);
    setEditMobile(emp.mobile);
    setEditEmail(emp.email);
    setEditDesignation(emp.designation);
    setEditRemarks(emp.remarks || '');
    setEditErrors({});
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const errs: Record<string, string> = {};
    if (!editName.trim()) errs.name = 'Full name is required.';
    if (!editMobile.trim() || !/^\d{10,15}$/.test(editMobile.trim())) {
      errs.mobile = 'Enter a valid mobile number (10-15 digits).';
    }
    if (!editEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim())) {
      errs.email = 'Enter a valid email address.';
    }
    if (!editDesignation.trim()) errs.designation = 'Designation is required.';

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    updateEmployee(
      editingEmployee.id,
      {
        full_name: editName.trim(),
        mobile: editMobile.trim(),
        email: editEmail.trim(),
        designation: editDesignation.trim(),
        remarks: editRemarks.trim(),
      },
      {
        email: editEmail.trim(),
      }
    );

    // Update selected employee in drawer if it is currently open
    if (selectedEmployee?.id === editingEmployee.id) {
      setSelectedEmployee({
        ...selectedEmployee,
        full_name: editName.trim(),
        mobile: editMobile.trim(),
        email: editEmail.trim(),
        designation: editDesignation.trim(),
        remarks: editRemarks.trim(),
      });
    }

    setEditingEmployee(null);
  };

  const handleResetPassword = (emp: EmployeeProfile) => {
    const pass = resetEmployeePassword(emp.id);
    if (pass) {
      setTempPasswordAlert({ name: emp.full_name, pass });
      setCopied(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status: 'ACTIVE' | 'SUSPENDED' | 'RETIRED') => {
    switch (status) {
      case 'ACTIVE':
        return 'paid';
      case 'SUSPENDED':
        return 'unpaid';
      case 'RETIRED':
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-bold font-heading text-slate-900">
            Office Staff Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage bar association office clerks, accountants, receptionists, and administrative operators.
          </p>
        </div>
        <Button
          variant="secondary"
          className="text-xs h-9 flex items-center gap-1.5"
          onClick={() => setIsWizardOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Search and Table List */}
      <Card>
        <CardHeader className="flex flex-col items-stretch gap-4 bg-slate-50/40">
          <div className="flex items-center justify-between gap-4">
            <div className="w-80 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="local-search"
                type="text"
                placeholder="Search code, name, designation, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>
            {searchQuery && (
              <Button
                variant="outline"
                className="text-xs h-9 border-slate-200"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="px-6 py-3.5">Code</th>
                  <th className="px-6 py-3.5">Full Name</th>
                  <th className="px-6 py-3.5">Designation</th>
                  <th className="px-6 py-3.5">Mobile</th>
                  <th className="px-6 py-3.5">Joining Date</th>
                  <th className="px-6 py-3.5">Account Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No employee records found.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const linkedUser = users.find((u) => u.id === emp.user_id);
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-700">
                          {emp.employee_code}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {emp.full_name}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {emp.designation}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {emp.mobile}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(emp.joining_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getStatusColor(emp.status)}>
                            {emp.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedEmployee(emp)}
                            className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer hover:underline inline-flex items-center gap-1"
                            title="View Info & Logs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                          <button
                            onClick={() => handleEditClick(emp)}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer hover:underline inline-flex items-center gap-1"
                            title="Edit Details"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          {linkedUser && (
                            <button
                              onClick={() => navigate(`/admin/settings?tab=staff&user=${linkedUser.id}`)}
                              className="text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer hover:underline inline-flex items-center gap-1"
                              title="Manage Permissions"
                            >
                              <Shield className="h-3.5 w-3.5" />
                              Permissions
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Staff Registration Wizard Modal */}
      <StaffRegistrationWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />

      {/* Reset Password Temporary Overlay Alert */}
      {tempPasswordAlert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-100 text-xs text-slate-650 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Key className="h-5 w-5 text-emerald-600" />
              <span>Password Successfully Reset</span>
            </div>
            
            <p className="leading-relaxed">
              A temporary portal credential has been generated for <strong>{tempPasswordAlert.name}</strong>. Provide them with this temporary code.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center font-mono text-sm font-bold text-slate-900">
              <span>{tempPasswordAlert.pass}</span>
              <button
                onClick={() => handleCopyToClipboard(tempPasswordAlert.pass)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                title="Copy Password"
              >
                {copied ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Clipboard className="h-4 w-4" />}
              </button>
            </div>

            <p className="text-[10px] text-amber-600 italic">
              * Note: The employee must reset this temporary key on their next login session.
            </p>

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setTempPasswordAlert(null)} className="h-9 text-xs">
                Okay, Closed
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Details Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden animate-scale-up border border-slate-100">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Edit className="h-4.5 w-4.5 text-indigo-600" />
                Edit Employee Details: {editingEmployee.employee_code}
              </span>
              <button onClick={() => setEditingEmployee(null)} className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSave} className="p-6 space-y-4 text-xs">
              <Input
                label="Full Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                error={editErrors.name}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Mobile Number"
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  error={editErrors.mobile}
                  required
                />
                <Input
                  label="Email Address"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  error={editErrors.email}
                  required
                />
              </div>

              <Input
                label="Designation / Role"
                value={editDesignation}
                onChange={(e) => setEditDesignation(e.target.value)}
                error={editErrors.designation}
                required
              />

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Remarks / Internal Notes
                </label>
                <textarea
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setEditingEmployee(null)} className="h-9">
                  Cancel
                </Button>
                <Button type="submit" className="h-9">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* side drawer for details and logs */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-6 overflow-hidden animate-slide-in relative">
            <button
              onClick={() => setSelectedEmployee(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Profile Overview Header */}
            <div className="border-b border-slate-100 pb-5 mt-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg font-heading shadow-md">
                  {selectedEmployee.full_name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedEmployee.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                      {selectedEmployee.employee_code}
                    </span>
                    <Badge variant={getStatusColor(selectedEmployee.status)}>{selectedEmployee.status}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto py-5 space-y-6 text-xs text-slate-600">
              {/* Profile Fields */}
              <div className="space-y-3.5">
                <h4 className="font-bold text-slate-900 uppercase tracking-widest text-[9px] border-b border-slate-100 pb-1.5">
                  Employment Profile
                </h4>
                
                <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-3">
                  <span className="font-semibold text-slate-400">Designation</span>
                  <span className="text-slate-800 font-medium">{selectedEmployee.designation}</span>

                  <span className="font-semibold text-slate-400">Mobile</span>
                  <span className="text-slate-800 font-medium flex items-center gap-1">
                    <Phone className="h-3 w-3 text-slate-400" />
                    {selectedEmployee.mobile}
                  </span>

                  <span className="font-semibold text-slate-400">Email</span>
                  <span className="text-slate-800 font-medium flex items-center gap-1 select-all">
                    <Mail className="h-3 w-3 text-slate-400" />
                    {selectedEmployee.email}
                  </span>

                  <span className="font-semibold text-slate-400">Joining Date</span>
                  <span className="text-slate-800 font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {new Date(selectedEmployee.joining_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>

                  {selectedEmployee.remarks && (
                    <>
                      <span className="font-semibold text-slate-400">Remarks</span>
                      <span className="text-slate-800 italic leading-relaxed">{selectedEmployee.remarks}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 uppercase tracking-widest text-[9px]">
                  Administrative Actions
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-9 text-[10px] border-slate-200 flex items-center justify-center gap-1"
                    onClick={() => handleResetPassword(selectedEmployee)}
                  >
                    <Key className="h-3.5 w-3.5 text-slate-500" />
                    Reset Password
                  </Button>
                  
                  {selectedEmployee.status === 'ACTIVE' ? (
                    <Button
                      variant="outline"
                      className="h-9 text-[10px] border-rose-100 text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1"
                      onClick={() => {
                        disableEmployee(selectedEmployee.id);
                        setSelectedEmployee({ ...selectedEmployee, status: 'SUSPENDED', is_active: false });
                      }}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                      Suspend Access
                    </Button>
                  ) : (
                    selectedEmployee.status !== 'RETIRED' && (
                      <Button
                        variant="outline"
                        className="h-9 text-[10px] border-emerald-100 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center gap-1"
                        onClick={() => {
                          enableEmployee(selectedEmployee.id);
                          setSelectedEmployee({ ...selectedEmployee, status: 'ACTIVE', is_active: true });
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Restore Access
                      </Button>
                    )
                  )}

                  {selectedEmployee.status !== 'RETIRED' && (
                    <Button
                      variant="outline"
                      className="h-9 text-[10px] border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1 col-span-2 mt-1"
                      onClick={() => {
                        if (confirm(`Are you sure you want to mark ${selectedEmployee.full_name} as RETIRED? This will suspend their login credentials forever.`)) {
                          retireEmployee(selectedEmployee.id);
                          setSelectedEmployee({ ...selectedEmployee, status: 'RETIRED', is_active: false });
                        }
                      }}
                    >
                      <Briefcase className="h-3.5 w-3.5" />
                      Mark as Retired
                    </Button>
                  )}
                </div>
              </div>

              {/* Employee Activity Logs */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 uppercase tracking-widest text-[9px]">
                  Employee Activity Audit Trail
                </h4>
                
                {(() => {
                  const logs = activityLogs.filter(
                    (log) =>
                      log.performed_by_id === selectedEmployee.user_id ||
                      (log.payload && log.payload.employee_id === selectedEmployee.id)
                  );

                  if (logs.length === 0) {
                    return (
                      <p className="text-[10px] text-slate-400 italic py-2">
                        No recorded log interactions for this employee.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {logs.map((log) => (
                        <div key={log.id} className="p-2 border border-slate-100 rounded-lg bg-slate-50/50 space-y-1">
                          <div className="flex justify-between items-center text-[9px] font-semibold text-slate-400 font-mono">
                            <span>{log.action_type}</span>
                            <span>{new Date(log.timestamp).toLocaleDateString('en-IN')}</span>
                          </div>
                          {log.payload && log.payload.temp_password && (
                            <p className="text-[10px] text-slate-600 leading-normal">
                              Password reset trigger. Temp key: <code className="font-bold font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">{log.payload.temp_password}</code>
                            </p>
                          )}
                          {log.payload && log.payload.diff_after && Object.keys(log.payload.diff_after).length > 0 && (
                            <p className="text-[9px] text-slate-400 truncate">
                              Fields changed: {Object.keys(log.payload.diff_after).join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end bg-white">
              <Button onClick={() => setSelectedEmployee(null)} className="h-9 text-xs">
                Close Drawer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
