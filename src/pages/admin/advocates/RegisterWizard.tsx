import React, { useState } from 'react';
import { useMockDB } from '@/contexts/MockDBContext';
import { useAdvocateService } from '@/hooks/useAdvocateService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { X, User, Award, CheckCircle } from 'lucide-react';
import type { Advocate } from '@/types';

interface RegisterWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterWizard: React.FC<RegisterWizardProps> = ({ isOpen, onClose }) => {
  const { advocates } = useMockDB();
  const { registerAdvocate } = useAdvocateService();
  const [step, setStep] = useState(1);

  // Form Fields State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [address, setAddress] = useState('');

  const [enrolmentNo, setEnrolmentNo] = useState('');
  const [kawfNo, setKawfNo] = useState('');
  const [dateOfEnrolment, setDateOfEnrolment] = useState('');
  const [joinedDate, setJoinedDate] = useState('');

  const [initialDues, setInitialDues] = useState('0.00');

  // Validations Errors State
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name is required.';
    if (!mobileNumber.trim()) {
      errs.mobileNumber = 'Mobile number is required.';
    } else if (!/^\d{10,15}$/.test(mobileNumber.trim())) {
      errs.mobileNumber = 'Enter a valid mobile number (10-15 digits).';
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Enter a valid email address.';
    }
    if (!dob.trim()) errs.dob = 'Date of birth is required.';
    if (!address.trim()) errs.address = 'Office Address is required.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    
    // Enrolment no validation
    if (!enrolmentNo.trim()) {
      errs.enrolmentNo = 'Enrolment number is required.';
    } else {
      const matchPattern = /^[\w/@./+-]+$/.test(enrolmentNo.trim());
      if (!matchPattern) {
        errs.enrolmentNo = 'Format invalid. Letters, digits, slash (/) and dashes only.';
      } else {
        // Duplicate check
        const isDuplicate = advocates.some(
          (a) => a.enrolment_no.toLowerCase() === enrolmentNo.trim().toLowerCase()
        );
        if (isDuplicate) {
          errs.enrolmentNo = 'Advocate with this enrolment number is already registered.';
        }
      }
    }

    // KAWF no duplicate check
    if (kawfNo.trim()) {
      const isDuplicate = advocates.some(
        (a) => a.kawf_no && a.kawf_no.toLowerCase() === kawfNo.trim().toLowerCase()
      );
      if (isDuplicate) {
        errs.kawfNo = 'Advocate with this KAWF number is already registered.';
      }
    }

    if (!dateOfEnrolment.trim()) errs.dateOfEnrolment = 'Date of enrolment is required.';
    if (!joinedDate.trim()) errs.joinedDate = 'Joined date is required.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 3) return;

    // Register Advocate
    const advocateData: Omit<Advocate, 'id' | 'user_id'> = {
      mobile_number: mobileNumber.trim(),
      enrolment_no: enrolmentNo.trim(),
      kawf_no: kawfNo.trim() || null,
      date_of_birth: dob,
      blood_group: bloodGroup,
      date_of_enrolment: dateOfEnrolment,
      joined_date: joinedDate,
      address: address.trim(),
      picture_url: null,
      status: 'ACTIVE',
      internal_notes: null,
    };

    // Call Mock Context registerAdvocate
    registerAdvocate(advocateData, name.trim(), email.trim());

    // Clear and close
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-xl shadow-2xl relative bg-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <CardHeader className="border-b border-slate-50 flex-col items-start gap-1">
          <h2 className="text-lg font-bold font-heading text-slate-900">
            Advocate Registration Wizard
          </h2>
          <p className="text-xs text-slate-500">
            Register new member &bull; Step {step} of 3
          </p>

          {/* Stepper bar */}
          <div className="w-full bg-slate-100 h-1 mt-4 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="py-6 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <User className="h-4 w-4 text-slate-400" />
                Personal Details
              </div>
              <Input
                label="Full Name"
                placeholder="e.g. Adv. Rajesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Mobile Number"
                  placeholder="e.g. 9846001122"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  error={errors.mobileNumber}
                />
                <Input
                  label="Email Address"
                  placeholder="e.g. rajesh@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date of Birth"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  error={errors.dob}
                />
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Office / Chamber Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter detailed chambers/residence address"
                  rows={3}
                  className={`w-full p-3 rounded-lg border text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent ${
                    errors.address ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200'
                  }`}
                />
                {errors.address && <p className="text-xs text-rose-500 mt-1">{errors.address}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Award className="h-4 w-4 text-slate-400" />
                Bar Admission Details
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Bar Enrolment Roll No"
                  placeholder="e.g. K/123/2021"
                  value={enrolmentNo}
                  onChange={(e) => setEnrolmentNo(e.target.value)}
                  error={errors.enrolmentNo}
                />
                <Input
                  label="KAWF Welfare No (Optional)"
                  placeholder="e.g. KAWF-10294"
                  value={kawfNo}
                  onChange={(e) => setKawfNo(e.target.value)}
                  error={errors.kawfNo}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date of Bar Enrolment"
                  type="date"
                  value={dateOfEnrolment}
                  onChange={(e) => setDateOfEnrolment(e.target.value)}
                  error={errors.dateOfEnrolment}
                />
                <Input
                  label="Joined HBA Date"
                  type="date"
                  value={joinedDate}
                  onChange={(e) => setJoinedDate(e.target.value)}
                  error={errors.joinedDate}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <CheckCircle className="h-4 w-4 text-slate-400" />
                Confirmation &amp; Ledger Initialization
              </div>

              {/* Dues Initialization */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-800">
                  Welfare Arrears Initialization
                </h4>
                <Input
                  label="Historical Due Amount (If Migrating Balance in ₹)"
                  placeholder="e.g. 0.00"
                  type="number"
                  value={initialDues}
                  onChange={(e) => setInitialDues(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Note: Registering will automatically schedule monthly billing dues from the Joined HBA Date ({joinedDate || 'unselected'}) to today. Any historical dues entered above will be added to the initial due tracking grid.
                </p>
              </div>

              {/* Confirmation Details Card */}
              <div className="border border-slate-150 rounded-xl p-4 text-xs space-y-2 text-slate-600 bg-white">
                <div className="flex justify-between">
                  <span>Advocate Name:</span>
                  <span className="font-semibold text-slate-900">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Username ID:</span>
                  <span className="font-semibold text-slate-900">{enrolmentNo} (Roll No)</span>
                </div>
                <div className="flex justify-between">
                  <span>Mobile Number:</span>
                  <span className="font-semibold text-slate-900">{mobileNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-semibold text-slate-900">{email || 'Not Provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span>HBA Admission Date:</span>
                  <span className="font-semibold text-slate-900">{joinedDate}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-slate-50 flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button variant="secondary" onClick={handleNext}>
              Continue
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleSubmit}>
              Complete Registration
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
