import React, { useState, useEffect } from 'react';
import { useMockDB } from '@/contexts/MockDBContext';
import { useEmployeeService } from '@/hooks/useEmployeeService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { X, User, Briefcase, Key } from 'lucide-react';

const PERMISSION_METADATA: Record<string, { label: string; desc: string }> = {
  view_personal_profile: {
    label: 'View Personal Profile',
    desc: 'Access personal advocate dashboard and profile details.',
  },
  view_personal_payments: {
    label: 'Access Personal Payments',
    desc: 'Inspect personal ledger, unpaid outstanding list, and receipt history.',
  },
  download_certificate: {
    label: 'Download Certificate',
    desc: 'Generate and print Experience Certificate (locks apply).',
  },
  view_operational_dashboard: {
    label: 'View Operational Dashboard',
    desc: 'Access admin panel home page, alerts list, and activity logs.',
  },
  manage_advocates: {
    label: 'Manage Member Profiles',
    desc: 'Create, modify, suspend, or update advocate profile records.',
  },
  collect_payments: {
    label: 'Collect Payments (Checkout)',
    desc: 'Process dues checkouts and issue receipt vouchers to advocates.',
  },
  view_reports: {
    label: 'View Accounting Reports',
    desc: 'Inspect association financial ledger logs and balance statistics.',
  },
  manage_settings: {
    label: 'Manage Association Settings',
    desc: 'Configure billing parameters, general settings, and staff credentials.',
  },
};

interface StaffRegistrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffRegistrationWizard: React.FC<StaffRegistrationWizardProps> = ({ isOpen, onClose }) => {
  const { employeeProfiles, users } = useMockDB();
  const { createEmployee } = useEmployeeService();
  const [step, setStep] = useState(1);

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');

  const [employeeCode, setEmployeeCode] = useState('');
  const [designation, setDesignation] = useState('');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('pass@123');
  const [isActive, setIsActive] = useState(true);
  const [selectedGroups, setSelectedGroups] = useState<('Advocate' | 'Office Staff' | 'Admin Advocate')[]>(['Office Staff']);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-generate employee code when opening the modal
  useEffect(() => {
    if (isOpen) {
      const nextNumber = employeeProfiles.reduce((max, e) => {
        const match = e.employee_code.match(/HBA-EMP-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 0) + 1;
      setEmployeeCode(`HBA-EMP-${nextNumber.toString().padStart(4, '0')}`);
      
      // Default username as name-based
      setUsername('');
      setFullName('');
      setMobile('');
      setEmail('');
      setDesignation('');
      setRemarks('');
      setPassword('pass@123');
      setIsActive(true);
      setSelectedGroups(['Office Staff']);
      setSelectedPermissions([]);
      setStep(1);
      setErrors({});
    }
  }, [isOpen, employeeProfiles]);

  if (!isOpen) return null;

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required.';
    if (!mobile.trim()) {
      errs.mobile = 'Mobile number is required.';
    } else if (!/^\d{10,15}$/.test(mobile.trim())) {
      errs.mobile = 'Enter a valid mobile number (10-15 digits).';
    }
    
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Enter a valid email address.';
    } else {
      // Unique check
      const emailDup = employeeProfiles.some((e) => e.email.toLowerCase() === email.trim().toLowerCase()) ||
                       users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (emailDup) {
        errs.email = 'This email is already in use by another user.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!employeeCode.trim()) {
      errs.employeeCode = 'Employee code is required.';
    } else {
      const codeDup = employeeProfiles.some((e) => e.employee_code.toLowerCase() === employeeCode.trim().toLowerCase());
      if (codeDup) {
        errs.employeeCode = 'This employee code is already assigned.';
      }
    }
    
    if (!designation.trim()) errs.designation = 'Designation is required.';
    if (!joiningDate) errs.joiningDate = 'Joining date is required.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!username.trim()) {
      errs.username = 'Username is required.';
    } else {
      const userDup = users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase());
      if (userDup) {
        errs.username = 'This username is already taken.';
      }
    }
    
    if (!password) {
      errs.password = 'Temporary password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) {
        // Pre-fill username if empty
        if (!username) {
          const defaultUser = fullName.trim().toLowerCase().replace(/\s+/g, '.');
          setUsername(defaultUser);
        }
        setStep(3);
      }
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 3) return;

    if (!validateStep3()) return;

    createEmployee(
      {
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        employeeCode: employeeCode.trim(),
        designation: designation.trim(),
        joiningDate: joiningDate,
        remarks: remarks.trim(),
      },
      {
        username: username.trim(),
        password: password,
        isActive: isActive,
        groups: selectedGroups,
        additionalPermissions: selectedPermissions,
      }
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
      <Card className="w-full max-w-xl shadow-2xl relative bg-white border border-slate-100 flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <CardHeader className="border-b border-slate-50 flex flex-col items-start gap-1 pb-4">
          <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-600" />
            Staff Registration Wizard
          </h2>
          <p className="text-xs text-slate-400">
            Create independent employee credentials &bull; Step {step} of 3
          </p>
          
          {/* Progress Indicator */}
          <div className="w-full flex items-center mt-4 bg-slate-100 rounded-full h-1">
            <div
              className="bg-emerald-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                <User className="h-4 w-4 text-emerald-600" />
                <span>Step 1: Personal Contact Details</span>
              </div>
              
              <Input
                label="Full Name"
                placeholder="e.g. Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.fullName}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Mobile Number"
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  error={errors.mobile}
                  required
                />
                <Input
                  label="Email Address"
                  placeholder="e.g. ramesh@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  required
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                <Briefcase className="h-4 w-4 text-emerald-600" />
                <span>Step 2: Association Employment Details</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Employee Code"
                  placeholder="e.g. HBA-EMP-0002"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  error={errors.employeeCode}
                  required
                />
                <Input
                  label="Designation / Job Role"
                  placeholder="e.g. Clerk, Accountant"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  error={errors.designation}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Joining Date
                </label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className={`w-full h-10 px-3 rounded-lg border bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent ${
                    errors.joiningDate ? 'border-rose-500' : 'border-slate-200'
                  }`}
                  required
                />
                {errors.joiningDate && <p className="text-xs text-rose-500 mt-1">{errors.joiningDate}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Operational Remarks
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional notes regarding roles, responsibilities or shift timings."
                  rows={3}
                  className="w-full p-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                <Key className="h-4 w-4 text-emerald-600" />
                <span>Step 3: Portal Credentials & Privileges</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Portal Username"
                  placeholder="e.g. ramesh.kumar"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  error={errors.username}
                  required
                />
                <Input
                  label="Temporary Password"
                  type="password"
                  placeholder="e.g. pass@123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  required
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-[10px] leading-relaxed">
                <strong>Force Password Reset:</strong> Since this is a temporary credential, the employee will be flagged as <code className="font-mono bg-amber-100 px-1 py-0.5 rounded font-bold">must_change_password</code> and forced to reset their credentials on their first login attempt.
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div>
                  <span className="font-bold text-slate-800 block">System Account Status</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Toggle to suspend access to the portal immediately.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    {isActive ? 'Active' : 'Suspended'}
                  </span>
                </label>
              </div>

              {/* Groups Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  System Group Assignment
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Office Staff', 'Admin Advocate'].map((gName) => {
                    const group = gName as 'Office Staff' | 'Admin Advocate';
                    const isChecked = selectedGroups.includes(group);
                    return (
                      <label
                        key={group}
                        className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedGroups(selectedGroups.filter((g) => g !== group));
                            } else {
                              setSelectedGroups([...selectedGroups, group]);
                            }
                          }}
                          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <span className="block font-semibold text-[11px]">{group}</span>
                          <span className="text-[9px] text-slate-400 leading-normal block mt-0.5">
                            {group === 'Office Staff' ? 'Access to register members and collect dues.' : 'Access to configuration and ledgers.'}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Direct Permissions Overrides */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Additional Override Permissions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {Object.keys(PERMISSION_METADATA).map((permKey) => {
                    const perm = PERMISSION_METADATA[permKey];
                    const isInherited = selectedGroups.some((g) => {
                      const perms = g === 'Office Staff' ? ['view_operational_dashboard', 'manage_advocates', 'collect_payments', 'view_reports', 'view_personal_profile'] : ['view_personal_profile', 'view_personal_payments', 'download_certificate', 'view_operational_dashboard', 'manage_advocates', 'collect_payments', 'view_reports', 'manage_settings'];
                      return perms.includes(permKey);
                    });
                    const isChecked = selectedPermissions.includes(permKey) || isInherited;
                    
                    return (
                      <div
                        key={permKey}
                        className={`p-2.5 rounded-lg border flex gap-2.5 items-start ${
                          isInherited
                            ? 'bg-slate-50 border-slate-100 opacity-70'
                            : isChecked
                            ? 'bg-emerald-50/20 border-emerald-100 text-emerald-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-705'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isInherited}
                          onChange={() => {
                            if (selectedPermissions.includes(permKey)) {
                              setSelectedPermissions(selectedPermissions.filter((p) => p !== permKey));
                            } else {
                              setSelectedPermissions([...selectedPermissions, permKey]);
                            }
                          }}
                          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                        />
                        <div>
                          <span className="font-semibold block text-[11px] flex items-center gap-1.5">
                            {perm.label}
                            {isInherited && (
                              <span className="text-[8px] bg-slate-100 text-slate-500 font-normal px-1 py-0.2 rounded font-sans uppercase">
                                Inherited
                              </span>
                            )}
                          </span>
                          <span className="text-[9px] text-slate-400 leading-normal block mt-0.5">
                            {perm.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </CardContent>

        <div className="p-4 border-t border-slate-100 flex justify-between bg-slate-50 rounded-b-xl">
          {step > 1 ? (
            <Button variant="outline" type="button" onClick={handleBack} className="text-xs h-9">
              Back
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={onClose} className="text-xs h-9">
              Cancel
            </Button>
            {step < 3 ? (
              <Button type="button" onClick={handleNext} className="text-xs h-9">
                Continue
              </Button>
            ) : (
              <Button type="submit" onClick={handleSubmit} className="text-xs h-9">
                Register Staff
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
