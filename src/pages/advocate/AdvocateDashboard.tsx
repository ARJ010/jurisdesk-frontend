import React, { useState, useEffect } from 'react';
import type { OfficePosition } from '@/types';
import { OfficialDocument } from '@/components/document/OfficialDocument';
import { useMockDB } from '@/contexts/MockDBContext';
import { usePaymentService } from '@/hooks/usePaymentService';
import { useReportService } from '@/hooks/useReportService';
import { useCertificateService } from '@/hooks/useCertificateService';
import { useAuthService } from '@/hooks/useAuthService';
import { useAdvocateService } from '@/hooks/useAdvocateService';
import { ROUTES } from '@/config/routes';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Mail, 
  Phone, 
  Heart, 
  ShieldAlert, 
  Award, 
  Calendar, 
  FileText, 
  ArrowRight, 
  Lock, 
  CheckCircle, 
  Printer, 
  X,
  AlertCircle,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdvocateDashboard: React.FC = () => {
  const { currentUser, advocates, officePositions, officeTerms, settings } = useMockDB();
  const { getAdvocateDueBalance, getAdvocateDues } = usePaymentService();
  const { getAdvocateReceipts } = useReportService();
  const { isAdvocateEligibleForCertificate } = useCertificateService();
  const { verifyCurrentPassword } = useAuthService();
  const { updateAdvocateProfile } = useAdvocateService();

  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  const [profileMobile, setProfileMobile] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEditModal = () => {
    if (advocate) {
      setProfileMobile(advocate.mobile_number || '');
      setProfileEmail(currentUser?.email || '');
      setProfileAddress(advocate.address || '');
      setCurrentPassword('');
      setProfileNewPassword('');
      setProfileConfirmPassword('');
      setEditError(null);
      setEditSuccess(false);
      setIsEditProfileModalOpen(true);
    }
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(false);

    if (!currentPassword) {
      setEditError('Current password is required to verify your identity.');
      return;
    }

    setIsSaving(true);
    const isPasswordValid = await verifyCurrentPassword(currentPassword);
    setIsSaving(false);

    if (!isPasswordValid) {
      setEditError('Incorrect current password.');
      return;
    }

    if (profileNewPassword || profileConfirmPassword) {
      if (profileNewPassword.length < 6) {
        setEditError('New password must be at least 6 characters long.');
        return;
      }
      if (profileNewPassword !== profileConfirmPassword) {
        setEditError('New password and password confirmation do not match.');
        return;
      }
    }

    if (advocate) {
      updateAdvocateProfile(
        advocate.id,
        { mobile_number: profileMobile, address: profileAddress },
        { email: profileEmail }
      );
      setEditSuccess(true);
      setTimeout(() => {
        setIsEditProfileModalOpen(false);
      }, 2000);
    }
  };

  const advocate = advocates.find((a) => a.user_id === currentUser?.id);
  const balance = advocate ? getAdvocateDueBalance(advocate.id) : 0;
  const dues = advocate ? getAdvocateDues(advocate.id) : [];
  const unpaidDuesCount = dues.filter((d) => d.status === 'UNPAID').length;
  const receipts = advocate ? getAdvocateReceipts(advocate.id).slice(0, 3) : [];
  const eligibility = advocate ? isAdvocateEligibleForCertificate(advocate.id) : { eligible: false, reason: 'Profile not loaded' };

  // Trigger Edit Profile modal open if ?edit_profile=true query param is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit_profile') === 'true') {
      handleOpenEditModal();
      // Remove query parameter from browser address bar without forcing reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [window.location.search, advocate]);

  // Calculate current active office positions sorted by display_order
  const activeOfficeTerms = advocate ? officeTerms.filter(t => t.advocate === advocate.id && t.is_current) : [];
  const activePositions = activeOfficeTerms
    .map(t => officePositions.find(p => p.id === t.position))
    .filter((p): p is OfficePosition => p !== undefined && p.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  // Generate dynamic certificate ID
  const certYear = new Date().getFullYear();
  const advocateIdPart = advocate ? advocate.id.split('-')[1] || '0001' : '0001';
  const certId = `HBA-EC-${certYear}-${advocateIdPart.padStart(4, '0')}`;

  // We need to import OfficePosition type from types, let's see if we need it
  // Since we use inline typing or it's already imported or we can let it infer, let's let it infer.

  if (!currentUser || !advocate) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <AlertCircle className="h-10 w-10 text-slate-300 animate-pulse" />
        <p className="mt-2 text-xs">Advocate profile record not found. Please contact administration.</p>
      </div>
    );
  }

  // Personal notification generation
  const personalAlerts = [];
  if (balance > 0) {
    personalAlerts.push({
      id: 'arrears',
      type: 'warning',
      text: `Outstanding arrears of ₹${balance.toFixed(2)} detected. Please clear these dues to ensure uninterrupted access to experience credentials.`,
    });
  }
  if (!advocate.kawf_no) {
    personalAlerts.push({
      id: 'kawf',
      type: 'danger',
      text: 'Compliance Warning: Your Kerala Advocates Welfare Fund (KAWF) number is not registered. Please submit it to the bar office.',
    });
  }
  // Standard September notice
  personalAlerts.push({
    id: 'onam-notice',
    type: 'info',
    text: 'Notice: The annual September Onam Contribution contribution of ₹500.00 is due by September 30, 2026. Advance payments are accepted.',
  });

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6 print:hidden">
        {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold font-heading text-slate-900">
          Member Workspace
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Access your personal credentials, view your ledger balance, and inspect your payment records.
        </p>
      </div>

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Member Card & Notifications */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Member Card */}
          <Card className="overflow-hidden border-slate-100">
            <div className="h-2 bg-gradient-to-r from-emerald-600 to-teal-500" />
            <CardContent className="flex flex-col items-center text-center pt-8">
              <div className="h-24 w-24 rounded-full bg-slate-100 border-2 border-white ring-4 ring-slate-100 flex items-center justify-center text-slate-500 font-bold text-2xl font-heading shadow-inner">
                {currentUser.first_name[0]}
                {currentUser.last_name[0]}
              </div>
              
              <h2 className="text-base font-bold font-heading text-slate-900 mt-4">
                Adv. {currentUser.first_name} {currentUser.last_name}
              </h2>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                Roll No: {advocate.enrolment_no}
              </p>
              
              {activePositions.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center mt-2">
                  {activePositions.map(pos => (
                    <Badge key={pos.id} variant="paid" className="text-[9px] uppercase font-bold tracking-wider">
                      {pos.name}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="mt-4 flex gap-1.5 justify-center flex-wrap">
                <Badge variant={balance > 0 ? 'unpaid' : 'paid'}>
                  {balance > 0 ? 'Arrears Pending' : 'Dues Cleared'}
                </Badge>
                <Badge variant={advocate.status === 'ACTIVE' ? 'neutral' : 'unpaid'}>
                  {advocate.status}
                </Badge>
              </div>

              <div className="w-full pt-6 mt-6 border-t border-slate-100 text-left space-y-3.5">
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{currentUser.email}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{advocate.mobile_number}</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{advocate.address || 'No Chambers Address Registered'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <Heart className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>Blood Group: {advocate.blood_group}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Joined Date: {formatDate(advocate.joined_date)}</span>
                </div>
              </div>

              <div className="w-full pt-4 mt-2 border-t border-slate-100">
                <Button onClick={handleOpenEditModal} className="w-full text-xs font-semibold" variant="outline">
                  Edit Personal Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Personal Notifications */}
          <Card className="border-slate-100">
            <CardHeader className="pb-3">
              <h3 className="text-xs font-bold font-heading text-slate-900 uppercase tracking-wider">
                Notifications & Announcements
              </h3>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {personalAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-lg border text-xs flex gap-2.5 ${
                    alert.type === 'danger' 
                      ? 'bg-rose-50 border-rose-100 text-rose-800'
                      : alert.type === 'warning'
                      ? 'bg-amber-50 border-amber-100 text-amber-800'
                      : 'bg-blue-50 border-blue-100 text-blue-800'
                  }`}
                >
                  {alert.type === 'danger' && <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />}
                  {alert.type === 'warning' && <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />}
                  {alert.type === 'info' && <FileText className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />}
                  
                  <p className="leading-normal">{alert.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Ledger, Certificates, Receipts */}
        <div className="lg:col-span-2 space-y-6">

          {/* Dues & Balance Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute right-4 top-4 bg-slate-50 text-slate-400 p-2.5 rounded-lg">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Outstanding Balance
              </span>
              <span className="text-2xl font-bold text-slate-950 mt-2 block font-heading">
                ₹{balance.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {balance > 0 ? `${unpaidDuesCount} pending billing periods` : 'Ledger fully cleared'}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute right-4 top-4 bg-slate-50 text-slate-400 p-2.5 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Welfare Fund Status
              </span>
              <span className="text-2xl font-bold text-slate-950 mt-2 block font-heading">
                {advocate.kawf_no ? 'Registered' : 'Pending'}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {advocate.kawf_no ? `ID: ${advocate.kawf_no}` : 'Please register welfare ID'}
              </span>
            </div>
          </div>

          {/* Experience Certificate Panel */}
          <Card className="border-slate-100">
            <CardHeader>
              <h3 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-600" />
                Experience Credentials
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-500 leading-normal">
                Generate an officially stamped Bar Association Experience Certificate verifying your registration date, practicing status, and good standing.
              </p>

              {eligibility.eligible ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3.5 flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-950">Credential Access Active</h4>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      You are in good standing with active status and zero outstanding balance. You can preview and print your Experience Certificate.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-100 rounded-lg p-3.5 flex items-start gap-3">
                  <Lock className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-rose-950">Credential Access Blocked</h4>
                    <p className="text-[11px] text-rose-700 mt-1">
                      {eligibility.reason}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button 
                  onClick={() => setIsCertModalOpen(true)}
                  disabled={!eligibility.eligible}
                  className="text-xs font-semibold"
                >
                  Preview & Print Certificate
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Receipts History */}
          <Card className="border-slate-100">
            <CardHeader className="flex justify-between items-center pb-3">
              <h3 className="text-xs font-bold font-heading text-slate-900 uppercase tracking-wider">
                Recent Payments
              </h3>
              <Link 
                to={ROUTES.PAYMENTS} 
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                Full Payments Portal
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {receipts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No payment collections on file.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="px-5 py-2.5">Receipt No</th>
                        <th className="px-5 py-2.5">Date</th>
                        <th className="px-5 py-2.5">Mode</th>
                        <th className="px-5 py-2.5 text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {receipts.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-2.5 font-semibold text-slate-800">
                            {tx.receipt_no}
                          </td>
                          <td className="px-5 py-2.5 text-slate-500">
                            {formatDate(tx.payment_date)}
                          </td>
                          <td className="px-5 py-2.5">
                            <Badge variant="neutral">{tx.payment_mode}</Badge>
                          </td>
                          <td className="px-5 py-2.5 font-bold text-slate-800 text-right">
                            ₹{tx.total_amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>
      </div>

      {/* A4 Printable Certificate Modal */}
      {isCertModalOpen && eligibility.eligible && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
          {/* Modal card wrapper */}
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:rounded-none print:w-full print:max-w-none print:max-h-none print:static print:overflow-visible">
            
            {/* Modal Actions Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-600" />
                <span className="font-bold text-slate-800 text-sm">Experience Certificate Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  id="print-trigger"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Printer className="h-4 w-4" />
                  Print Certificate
                </Button>
                <button 
                  onClick={() => setIsCertModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Preview Pane */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center print:bg-white print:p-0 print:overflow-visible">
              
              {/* Certificate Sheet (Simulating A4) */}
              <OfficialDocument
                title="Experience Certificate"
                documentId={certId}
                date={formatDate(new Date().toISOString())}
                place={settings.address.split(',')[1]?.trim() || 'Kanhangad'}
              >
                <div className="text-justify text-[13px] leading-loose space-y-5 text-slate-700 font-sans my-auto py-4">
                  <p>
                    This is to certify that <span className="font-bold text-slate-900">Adv. {currentUser.first_name} {currentUser.last_name}</span> (Roll No. <span className="font-bold text-slate-900">{advocate.enrolment_no}</span>) is a registered member of the {settings.association_name}, {settings.address.split(',')[1]?.trim() || 'Kanhangad'}.
                  </p>
                  <p>
                    According to our records, he/she was enrolled as an Advocate on the rolls of the Bar Council of Kerala on <span className="font-semibold text-slate-900">{formatDate(advocate.date_of_enrolment)}</span> and was admitted to this Association as a member on <span className="font-semibold text-slate-900">{formatDate(advocate.joined_date)}</span>.
                  </p>
                  <p>
                    He/She has been actively and continuously practicing before the Honorable Judicial First Class Magistrate Courts, Subordinate Courts, and other Tribunals at {settings.address.split(',')[1]?.trim() || 'Kanhangad'} for the last <span className="font-bold text-slate-900">{new Date().getFullYear() - new Date(advocate.joined_date).getFullYear()} years</span>.
                  </p>
                  {activePositions.length > 0 && (
                    <p>
                      He/She is currently serving the association as <span className="font-bold text-slate-900">{activePositions.map(p => p.name).join(', ')}</span>.
                    </p>
                  )}
                  <p>
                    During this tenure, his/her professional conduct and moral character have been found to be exemplary. We wish him/her success in all future professional endeavors.
                  </p>
                </div>
              </OfficialDocument>
            </div>
          </div>
        </div>
      )}

      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="font-bold text-slate-800 text-sm">Edit Personal Profile</span>
              <button 
                onClick={() => setIsEditProfileModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleEditProfileSubmit} className="space-y-4 text-xs">
                {editError && (
                  <div className="bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-100 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{editError}</span>
                  </div>
                )}
                {editSuccess && (
                  <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg border border-emerald-100 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-650" />
                    <span>Profile updated successfully!</span>
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-500 uppercase tracking-wider mb-1 font-semibold">Mobile Number</label>
                    <input
                      type="text"
                      required
                      value={profileMobile}
                      onChange={(e) => setProfileMobile(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 uppercase tracking-wider mb-1 font-semibold">Email Address</label>
                    <input
                      type="email"
                      required
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 uppercase tracking-wider mb-1 font-semibold">Chambers Address</label>
                    <textarea
                      required
                      value={profileAddress}
                      onChange={(e) => setProfileAddress(e.target.value)}
                      rows={2}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  
                  <div className="border-t border-slate-100 pt-3">
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2">Change Password (Optional)</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-slate-500 uppercase tracking-wider mb-1 font-semibold">New Password</label>
                        <input
                          type="password"
                          value={profileNewPassword}
                          onChange={(e) => setProfileNewPassword(e.target.value)}
                          placeholder="Leave blank to keep current"
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 uppercase tracking-wider mb-1 font-semibold">Confirm New Password</label>
                        <input
                          type="password"
                          value={profileConfirmPassword}
                          onChange={(e) => setProfileConfirmPassword(e.target.value)}
                          placeholder="Leave blank to keep current"
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <label className="block text-slate-800 uppercase tracking-wider mb-1 font-bold">
                      Current Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Verify identity to save"
                      className="w-full p-2.5 rounded-lg border border-slate-900 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  
                  <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded border border-slate-100">
                    <p className="font-semibold text-slate-500">Future profile options (read-only):</p>
                    <p className="mt-0.5">• Profile Photograph (Future extension)</p>
                    <p>• Emergency Contact (Future extension)</p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditProfileModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="secondary" disabled={isSaving}>
                    {isSaving ? 'Verifying...' : 'Save Profile'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
