import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMockDB } from '@/contexts/MockDBContext';
import { usePaymentService } from '@/hooks/usePaymentService';
import { useReportService } from '@/hooks/useReportService';
import { useAdvocateService } from '@/hooks/useAdvocateService';
import { useSettingsService } from '@/hooks/useSettingsService';
import type { OfficePosition } from '@/types';
import { PERMISSIONS } from '@/config/permissions';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  User,
  CalendarDays,
  ShoppingCart,
  Receipt as ReceiptIcon,
  History,
  ShieldCheck,
  ChevronLeft,
  ShieldAlert,
  Calendar,
  CheckCircle,
  Scale,
  AlertCircle,
  Printer,
  X,
  CreditCard,
} from 'lucide-react';
import type { PaymentTransaction, PaymentMode } from '@/types';

export const AdvocateWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentUser,
    advocates,
    users,
    dues,
    paymentLines,
    settings,
  } = useMockDB();
  const { getAdvocateDueBalance, getAdvocateDues, checkoutBasket, waiveDue } = usePaymentService();
  const { getAdvocateReceipts, getAdvocateTimeline } = useReportService();
  const { updateAdvocateProfile } = useAdvocateService();

  // Tab State
  const [activeTab, setActiveTab] = useState<'profile' | 'registry' | 'checkout' | 'ledger' | 'receipts' | 'timeline' | 'security'>(() => {
    const queryTab = new URLSearchParams(window.location.search).get('tab');
    if (queryTab && ['profile', 'registry', 'checkout', 'ledger', 'receipts', 'timeline', 'security'].includes(queryTab)) {
      return queryTab as any;
    }
    return 'profile';
  });

  useEffect(() => {
    const queryTab = new URLSearchParams(window.location.search).get('tab');
    if (queryTab && ['profile', 'registry', 'checkout', 'ledger', 'receipts', 'timeline', 'security'].includes(queryTab)) {
      setActiveTab(queryTab as any);
    }
  }, [window.location.search]);

  // Checkout Basket State
  const [selectedDueIds, setSelectedDueIds] = useState<number[]>([]);
  const [advanceCount, setAdvanceCount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Active Receipt Modal state (for previewing printable receipts)
  const [activeReceipt, setActiveReceipt] = useState<PaymentTransaction | null>(null);
  
  // Profile editing fields state
  const advocate = advocates.find((a) => a.id === id);
  const user = advocate ? users.find((u) => u.id === advocate.user_id) : null;
  const balance = advocate ? getAdvocateDueBalance(advocate.id) : 0;

  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Call settings service
  const { 
    officePositions, 
    officeTerms, 
    updateOfficeTerms 
  } = useSettingsService();

  // Active positions of the advocate
  const activeOfficeTerms = advocate ? officeTerms.filter(t => t.advocate === advocate.id && t.is_current) : [];
  const activePositions = activeOfficeTerms
    .map(t => officePositions.find(p => p.id === t.position))
    .filter((p): p is OfficePosition => p !== undefined && p.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  // Registry form states
  const [editBloodGroup, setEditBloodGroup] = useState('');
  const [editInternalNotes, setEditInternalNotes] = useState('');
  const [editStatus, setEditStatus] = useState<any>('ACTIVE');

  const [editEnrolmentNo, setEditEnrolmentNo] = useState('');
  const [editDateOfEnrolment, setEditDateOfEnrolment] = useState('');
  const [editJoinedDate, setEditJoinedDate] = useState('');
  const [editKawfNo, setEditKawfNo] = useState('');

  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editDOB, setEditDOB] = useState('');

  const [adminRemarks, setAdminRemarks] = useState('');
  const [registrySuccess, setRegistrySuccess] = useState(false);
  const [registryError, setRegistryError] = useState<string | null>(null);

  // Admin Contact Editing States
  const [adminContactSuccess, setAdminContactSuccess] = useState(false);
  const [adminContactError, setAdminContactError] = useState<string | null>(null);
  
  // Office positions assignment checklist state
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [positionSuccess, setPositionSuccess] = useState(false);

  useEffect(() => {
    if (advocate && user) {
      setEditMobile(advocate.mobile_number || '');
      setEditEmail(user.email || '');
      setEditAddress(advocate.address || '');
      setEditBloodGroup(advocate.blood_group || 'B+');
      setEditInternalNotes(advocate.internal_notes || '');
      setEditStatus(advocate.status || 'ACTIVE');

      setEditEnrolmentNo(advocate.enrolment_no || '');
      setEditDateOfEnrolment(advocate.date_of_enrolment || '');
      setEditJoinedDate(advocate.joined_date || '');
      setEditKawfNo(advocate.kawf_no || '');

      setEditFirstName(user.first_name || '');
      setEditLastName(user.last_name || '');
      setEditDOB(advocate.date_of_birth || '');
      setAdminRemarks('');

      const current = officeTerms.filter(t => t.advocate === advocate.id && t.is_current).map(t => t.position);
      setSelectedPositions(current);
    }
  }, [advocate, user, officeTerms]);

  // Security Credentials reset state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);

  if (!advocate || !user || !currentUser) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-lg font-bold font-heading text-slate-800">Advocate Not Found</h2>
        <Button variant="ghost" className="mt-4 text-xs" onClick={() => navigate('/admin/advocates')}>
          Back to Directory
        </Button>
      </div>
    );
  }

  // Derive dues & receipts for this specific member
  const memberDues = getAdvocateDues(advocate.id);
  const memberReceipts = getAdvocateReceipts(advocate.id);
  const memberTimeline = getAdvocateTimeline(advocate.id);
  const unpaidDues = memberDues.filter((d) => d.status === 'UNPAID');

  const showRegistryTab = currentUser.user_permissions.includes('manage_advocates');

  const tabs: {
    id: 'profile' | 'registry' | 'checkout' | 'ledger' | 'receipts' | 'timeline' | 'security';
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'profile', label: 'Overview', icon: <User className="h-4 w-4" /> },
    ...(showRegistryTab ? [{ id: 'registry', label: 'Registry Metadata', icon: <Scale className="h-4 w-4" /> } as const] : []),
    { id: 'checkout', label: 'Checkout', icon: <ShoppingCart className="h-4 w-4" /> },
    { id: 'ledger', label: 'Ledger', icon: <CalendarDays className="h-4 w-4" /> },
    { id: 'receipts', label: 'Receipts', icon: <ReceiptIcon className="h-4 w-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <History className="h-4 w-4" /> },
    { id: 'security', label: 'Security', icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  // Toggle checklist selection for arrears
  const handleToggleDueSelect = (dueId: number) => {
    setSelectedDueIds((prev) =>
      prev.includes(dueId) ? prev.filter((id) => id !== dueId) : [...prev, dueId]
    );
  };

  const handleSelectAllArrears = () => {
    if (selectedDueIds.length === unpaidDues.length) {
      setSelectedDueIds([]);
    } else {
      setSelectedDueIds(unpaidDues.map((d) => d.id));
    }
  };

  // Perform basket checkout operation
  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDueIds.length === 0 && advanceCount === 0) {
      setCheckoutError('Please select outstanding months or add advance months to checkout.');
      return;
    }

    if (paymentMode !== 'CASH' && !transactionRef.trim()) {
      setCheckoutError(`Transaction reference is required for ${paymentMode} collections.`);
      return;
    }

    setCheckoutError(null);
    try {
      const receipt = await checkoutBasket(
        advocate.id,
        selectedDueIds,
        advanceCount,
        paymentMode,
        transactionRef.trim() || null,
        remarks.trim() || null
      );

      // Open printable receipt preview
      setActiveReceipt(receipt);
      
      // Reset checkout states
      setSelectedDueIds([]);
      setAdvanceCount(0);
      setTransactionRef('');
      setRemarks('');
    } catch (err) {
      setCheckoutError('An error occurred during checkout processing.');
    }
  };

  // Administrative Contact Information update submission
  const handleAdminContactSave = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminContactSuccess(false);
    setAdminContactError(null);

    if (!editMobile.trim() || !editEmail.trim() || !editAddress.trim()) {
      setAdminContactError('All contact fields are required.');
      return;
    }

    try {
      updateAdvocateProfile(
        advocate.id,
        { mobile_number: editMobile.trim(), address: editAddress.trim() },
        { email: editEmail.trim() },
        undefined,
        'PROFILE_UPDATED_BY_ADMIN'
      );
      setAdminContactSuccess(true);
      setTimeout(() => setAdminContactSuccess(false), 4000);
    } catch (err) {
      setAdminContactError('An error occurred while saving contact information.');
    }
  };

  // Registry update submission
  const handleRegistrySave = (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrySuccess(false);
    setRegistryError(null);

    // Check if rare administrative fields have been modified
    const isFirstNameChanged = editFirstName !== user.first_name;
    const isLastNameChanged = editLastName !== user.last_name;
    const isDOBChanged = editDOB !== advocate.date_of_birth;
    const hasRareChange = isFirstNameChanged || isLastNameChanged || isDOBChanged;

    if (hasRareChange && !adminRemarks.trim()) {
      setRegistryError('Administrative remarks explaining the reason for modifying Name or DOB are required.');
      return;
    }

    const advocateFields = {
      blood_group: editBloodGroup,
      internal_notes: editInternalNotes || null,
      status: editStatus,
      enrolment_no: editEnrolmentNo,
      date_of_enrolment: editDateOfEnrolment,
      joined_date: editJoinedDate,
      kawf_no: editKawfNo || null,
      date_of_birth: editDOB,
    };

    const userFields = {
      first_name: editFirstName,
      last_name: editLastName,
    };

    try {
      updateAdvocateProfile(
        advocate.id,
        advocateFields,
        userFields,
        hasRareChange ? adminRemarks.trim() : undefined
      );
      setRegistrySuccess(true);
      setAdminRemarks('');
      setTimeout(() => setRegistrySuccess(false), 4000);
    } catch (err) {
      setRegistryError('An error occurred while saving registry metadata.');
    }
  };

  // Office assignments submission
  const handlePositionsSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPositionSuccess(false);
    try {
      updateOfficeTerms(advocate.id, `${user.first_name} ${user.last_name}`, selectedPositions);
      setPositionSuccess(true);
      setTimeout(() => setPositionSuccess(false), 4000);
    } catch (err) {
      // ignore
    }
  };

  // Password reset submission
  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecuritySuccess(false);

    if (newPassword.length < 6) {
      setSecurityError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityError('Passwords do not match.');
      return;
    }

    // Success log is added automatically in MockContext profile timeline hooks
    setSecuritySuccess(true);
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSecuritySuccess(false), 3000);
  };

  // Trigger browser print
  const handlePrintReceipt = () => {
    window.print();
  };

  // Calculate dynamic basket totals
  const totalArrearsAmount = selectedDueIds.reduce((sum, id) => {
    const d = dues.find((due) => due.id === id);
    return sum + (d ? d.total_due_amount : 0);
  }, 0);
  
  // Hardcoded standard monthly base fee: ₹100.00
  const advanceRate = 100.00;
  const totalAdvanceAmount = advanceCount * advanceRate;
  const basketTotal = totalArrearsAmount + totalAdvanceAmount;

  return (
    <div className="space-y-6">
      {/* Printable Receipt Modal Layer (Styled for media print to isolate voucher layout) */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 print:p-0 print:bg-white print:static print:overflow-visible">
          <Card className="w-full max-w-2xl bg-white shadow-2xl relative print:shadow-none print:border-none print:w-full print:max-w-none print:static print:overflow-visible print:max-h-none">
            {/* Close button - hidden on print */}
            <button
              onClick={() => setActiveReceipt(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer print:hidden"
            >
              <X className="h-5 w-5" />
            </button>

            <CardContent className="p-8 print:p-6 space-y-6">
              <div className="text-center border-b border-slate-200 pb-4 flex items-center justify-center gap-4">
                {settings.logo_url && (
                  <img src={settings.logo_url} alt="Logo" className="w-10 h-10 object-contain" />
                )}
                <div>
                  <h1 className="text-lg font-bold tracking-widest text-slate-800 uppercase">
                    {settings.association_name}
                  </h1>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    {settings.address}
                  </p>
                  <p className="text-[9px] text-slate-450 mt-0.5">
                    Phone: {settings.phone} | Email: {settings.email}
                    {settings.website && ` | Web: ${settings.website}`}
                  </p>
                </div>
              </div>

              {/* Transaction Meta Details */}
              <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 pb-4">
                <div className="space-y-1.5">
                  <p className="text-slate-500">
                    Receipt No:{' '}
                    <span className="font-bold text-slate-800">{activeReceipt.receipt_no}</span>
                  </p>
                  <p className="text-slate-500">
                    Date:{' '}
                    <span className="font-semibold text-slate-700">
                      {new Date(activeReceipt.payment_date).toLocaleString('en-IN')}
                    </span>
                  </p>
                  <p className="text-slate-500">
                    Payment Mode:{' '}
                    <span className="font-semibold text-slate-700 uppercase">
                      {activeReceipt.payment_mode}
                    </span>
                  </p>
                  {activeReceipt.transaction_ref && (
                    <p className="text-slate-500">
                      Reference ID:{' '}
                      <span className="font-mono text-slate-700 font-semibold bg-slate-50 px-1 rounded border border-slate-100">
                        {activeReceipt.transaction_ref}
                      </span>
                    </p>
                  )}
                </div>
                <div className="space-y-1.5 text-right">
                  <h4 className="font-bold text-slate-800">{user.first_name} {user.last_name}</h4>
                  <p className="text-slate-500">Roll No: {advocate.enrolment_no}</p>
                  <p className="text-slate-500">Mobile: {advocate.mobile_number}</p>
                </div>
              </div>

              {/* Payment Lines Table */}
              <div className="border border-slate-100 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="px-4 py-2">Billing Period</th>
                      <th className="px-4 py-2">Line Component</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentLines
                      .filter((l) => l.transaction_id === activeReceipt.id)
                      .map((line) => (
                        <tr key={line.id}>
                          <td className="px-4 py-2 font-semibold text-slate-700">
                            {line.month}/{line.year}
                          </td>
                          <td className="px-4 py-2 text-slate-500 capitalize">
                            {line.fee_component.replace('_', ' ').toLowerCase()}
                          </td>
                          <td className="px-4 py-2 text-right font-bold text-slate-800">
                            ₹{line.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50/50 border-t border-slate-150 font-bold text-slate-900 text-sm">
                      <td colSpan={2} className="px-4 py-3">Total Amount Paid</td>
                      <td className="px-4 py-3 text-right text-emerald-700">
                        ₹{activeReceipt.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures */}
              <div className="flex justify-between pt-12 text-center text-xs">
                <div className="w-40 border-t border-slate-200 pt-1 text-slate-400 font-medium">
                  Prepared By
                </div>
                <div className="w-44 border-t border-slate-200 pt-1 text-slate-800 font-bold">
                  Treasurer / Secretary
                  <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                    {settings.association_name}
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-between print:hidden">
              <Button variant="outline" onClick={() => setActiveReceipt(null)}>
                Close Preview
              </Button>
              <Button id="print-trigger" variant="secondary" className="flex items-center gap-1.5" onClick={handlePrintReceipt}>
                <Printer className="h-4 w-4" /> Print Receipt
              </Button>
            </CardFooter>
          </Card>

          {/* Global print styles injection */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: auto;
                margin: 20mm;
              }
              body {
                background: white !important;
              }
            }
          `}} />
        </div>
      )}

      <div className="space-y-6 print:hidden">
        {/* Workspace Back Header */}
      <div className="flex items-center gap-4 print:hidden">
        <Button
          variant="outline"
          className="h-9 w-9 p-0 rounded-full border-slate-200"
          onClick={() => navigate('/admin/advocates')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold font-heading text-slate-900 flex items-center">
            {user.first_name} {user.last_name}
            {activePositions.length > 0 && (
              <span className="text-xs font-normal text-slate-400 font-sans ml-2">
                ({activePositions.map(p => p.name).join(' | ')})
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Advocate Workspace &bull; Enrolment: {advocate.enrolment_no}
          </p>
        </div>
      </div>

      {/* Profile Header Summary */}
      <Card className="print:hidden">
        <CardContent className="p-6 flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center font-bold text-lg text-slate-600 shadow-inner">
              {user.first_name[0]}
              {user.last_name[0]}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Joined HBA: {advocate.joined_date}</p>
              {activePositions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {activePositions.map(pos => (
                    <Badge key={pos.id} variant="paid" className="text-[9px] uppercase font-bold tracking-wider">
                      {pos.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-8">
            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Outstanding Balance
              </span>
              <span className={`text-lg font-bold font-heading mt-0.5 block ${balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                ₹{balance.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Registry Status
              </span>
              <Badge variant={advocate.status === 'ACTIVE' ? 'paid' : 'unpaid'} className="mt-1">
                {advocate.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto pb-px print:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all duration-150 cursor-pointer ${
              activeTab === tab.id
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Workspaces */}
      <div className="pt-2 print:hidden">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row justify-between items-center pb-2">
                <h3 className="text-sm font-bold font-heading">Personal Profile Details</h3>
                {showRegistryTab && (
                  <Button variant="ghost" className="text-xs text-indigo-600 font-semibold p-0 h-auto" onClick={() => setActiveTab('registry')}>
                    Edit Profile / Registry
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-slate-650">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-50/50 rounded-lg border border-slate-100">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Mobile Number</span>
                    <span className="text-sm font-semibold text-slate-800">{advocate.mobile_number || 'N/A'}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50/50 rounded-lg border border-slate-100">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Email Address</span>
                    <span className="text-sm font-semibold text-slate-800">{user.email || 'N/A'}</span>
                  </div>
                </div>
                <div className="p-3.5 bg-slate-50/50 rounded-lg border border-slate-100">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Chambers Address</span>
                  <span className="text-sm font-semibold text-slate-800 whitespace-pre-wrap">{advocate.address || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader>
                <h3 className="text-sm font-bold font-heading">Registry Metadata</h3>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-slate-600">
                <div className="flex justify-between pb-2.5 border-b border-slate-50">
                  <span>Date of Birth:</span>
                  <span className="font-semibold text-slate-800">{advocate.date_of_birth}</span>
                </div>
                <div className="flex justify-between pb-2.5 border-b border-slate-50">
                  <span>Date of Enrolment:</span>
                  <span className="font-semibold text-slate-800">{advocate.date_of_enrolment}</span>
                </div>
                <div className="flex justify-between pb-2.5 border-b border-slate-50">
                  <span>KAWF Welfare ID:</span>
                  <span className="font-semibold text-slate-800">{advocate.kawf_no || 'Missing Registration'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Blood Group:</span>
                  <span className="font-semibold text-slate-800">{advocate.blood_group}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB: REGISTRY METADATA */}
        {activeTab === 'registry' && showRegistryTab && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1 & 2: Edit Form */}
            {/* Column 1 & 2: Forms */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-bold font-heading">Edit Registry Metadata Record</h3>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegistrySave} className="space-y-6 text-xs">
                    {registryError && (
                      <div className="bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-200 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {registryError}
                      </div>
                    )}
                    {registrySuccess && (
                      <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg border border-emerald-250 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 shrink-0" /> Registry metadata saved successfully!
                      </div>
                    )}

                    {/* Section 1: Ordinary Registry Metadata fields */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] border-b pb-1">
                        Registry Metadata Fields
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-500 uppercase tracking-wider mb-1 font-semibold">Blood Group</label>
                          <select
                            value={editBloodGroup}
                            onChange={(e) => setEditBloodGroup(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                          >
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                              <option key={bg} value={bg}>{bg}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-500 uppercase tracking-wider mb-1 font-semibold">Registry Status</label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as any)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                          >
                            {['ACTIVE', 'SUSPENDED', 'RETIRED', 'DECEASED'].map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-500 uppercase tracking-wider mb-1 font-semibold">Internal Notes (Administrative only)</label>
                        <textarea
                          value={editInternalNotes}
                          onChange={(e) => setEditInternalNotes(e.target.value)}
                          rows={2}
                          placeholder="Add private administrative notes..."
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    {/* Section 2: Sensitive Registry fields */}
                    <div className="space-y-4 pt-2">
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] border-b pb-1 flex items-center gap-1.5 text-amber-700 font-sans">
                        <AlertCircle className="h-3.5 w-3.5" /> Sensitive Registry Data (Triggers Audit Logs)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-500 uppercase tracking-wider mb-1 font-semibold">Enrolment Number</label>
                          <input
                            type="text"
                            value={editEnrolmentNo}
                            onChange={(e) => setEditEnrolmentNo(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 uppercase tracking-wider mb-1 font-semibold">Kerala Welfare ID (KAWF Number)</label>
                          <input
                            type="text"
                            value={editKawfNo}
                            onChange={(e) => setEditKawfNo(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-500 uppercase tracking-wider mb-1 font-semibold">Enrolment Date</label>
                          <input
                            type="date"
                            value={editDateOfEnrolment}
                            onChange={(e) => setEditDateOfEnrolment(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 uppercase tracking-wider mb-1 font-semibold">Joined HBA Date</label>
                          <input
                            type="date"
                            value={editJoinedDate}
                            onChange={(e) => setEditJoinedDate(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Rare Administrative fields */}
                    <div className="space-y-4 pt-2">
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] border-b pb-1 flex items-center gap-1.5 text-rose-700 font-sans">
                        <ShieldAlert className="h-3.5 w-3.5" /> Rare Administrative Changes (Requires Explanatory Remarks)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-slate-500 uppercase tracking-wider mb-1 font-semibold">First Name</label>
                          <input
                            type="text"
                            value={editFirstName}
                            onChange={(e) => setEditFirstName(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 uppercase tracking-wider mb-1 font-semibold">Last Name</label>
                          <input
                            type="text"
                            value={editLastName}
                            onChange={(e) => setEditLastName(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 uppercase tracking-wider mb-1 font-semibold">Date of Birth</label>
                          <input
                            type="date"
                            value={editDOB}
                            onChange={(e) => setEditDOB(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                          />
                        </div>
                      </div>

                      {/* Explanatory remarks */}
                      {(editFirstName !== user.first_name || editLastName !== user.last_name || editDOB !== advocate.date_of_birth) && (
                        <div className="space-y-1 bg-rose-50/50 p-3 rounded-lg border border-rose-150">
                          <label className="block text-rose-800 uppercase tracking-wider mb-1 font-bold">
                            Reason for Administrative Modification *
                          </label>
                          <textarea
                            required
                            value={adminRemarks}
                            onChange={(e) => setAdminRemarks(e.target.value)}
                            placeholder="e.g. Court Gazette Correction"
                            className="w-full p-2.5 rounded-lg border border-rose-350 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                            rows={2}
                          />
                          <p className="text-[10px] text-slate-400">
                            These remarks will be permanently recorded in the `REGISTRY_UPDATED` system activity logs.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button type="submit" variant="secondary" className="text-xs">
                        Save Registry Metadata
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Personal Contact Information Override Section */}
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-bold font-heading text-slate-900">Personal Contact Information</h3>
                  <p className="text-[10px] text-slate-400 font-normal">
                    Administrative override to assist advocates with updating contact information.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAdminContactSave} className="space-y-4 text-xs">
                    {adminContactError && (
                      <div className="bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-100 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                        <span>{adminContactError}</span>
                      </div>
                    )}
                    {adminContactSuccess && (
                      <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg border border-emerald-250 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-650" />
                        <span>Contact information updated successfully!</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-500 uppercase tracking-wider mb-1 font-semibold">Mobile Number</label>
                        <input
                          type="text"
                          required
                          value={editMobile}
                          onChange={(e) => setEditMobile(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 uppercase tracking-wider mb-1 font-semibold">Official Email Address</label>
                        <input
                          type="email"
                          required
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-500 uppercase tracking-wider mb-1 font-semibold">Chambers Address</label>
                      <textarea
                        required
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        rows={2.5}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button type="submit" variant="secondary" className="text-xs">
                        Update Contact Info
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Column 3: Office Position Assignments */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-bold font-heading">Office Bearer Assignments</h3>
                  <p className="text-[10px] text-slate-400 font-normal">Check the active positions currently held by this advocate.</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePositionsSave} className="space-y-4 text-xs">
                    {positionSuccess && (
                      <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-lg border border-emerald-250 flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 shrink-0" /> Assignments updated successfully!
                      </div>
                    )}
                    <div className="space-y-2 border rounded-lg p-3 max-h-64 overflow-y-auto bg-slate-50/50">
                      {officePositions.filter(p => p.is_active).sort((a,b) => a.display_order - b.display_order).map((pos) => {
                        const isChecked = selectedPositions.includes(pos.id);
                        return (
                          <label key={pos.id} className="flex items-start gap-2.5 p-2 hover:bg-slate-100 rounded cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedPositions(prev =>
                                  prev.includes(pos.id) ? prev.filter(id => id !== pos.id) : [...prev, pos.id]
                                );
                              }}
                              className="mt-0.5 rounded border-slate-300 text-slate-800 focus:ring-slate-900"
                            />
                            <div>
                              <span className="font-semibold text-slate-800 block">{pos.name}</span>
                              {pos.description && <span className="text-[10px] text-slate-400 block mt-0.5">{pos.description}</span>}
                            </div>
                          </label>
                        );
                      })}
                      {officePositions.filter(p => p.is_active).length === 0 && (
                        <p className="text-slate-400 italic text-center py-4">No active positions configured.</p>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button type="submit" variant="secondary" className="text-xs">
                        Save Assignments
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Historical appointments list */}
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-bold font-heading">Historical Office Bearer Log</h3>
                  <p className="text-[10px] text-slate-400 font-normal">Past administrative assignments held by this advocate.</p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {officeTerms.filter(t => t.advocate === advocate.id && !t.is_current).length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-8 italic">No historical assignments on record.</p>
                    ) : (
                      officeTerms
                        .filter(t => t.advocate === advocate.id && !t.is_current)
                        .map((t) => {
                          const posObj = officePositions.find(p => p.id === t.position);
                          return (
                            <div key={t.id} className="p-3 text-xs flex justify-between items-start">
                              <div>
                                <span className="font-semibold text-slate-800 block">
                                  {posObj ? posObj.name : 'Unknown Role'}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Term: {t.start_date} &rarr; {t.end_date || 'N/A'}
                                </span>
                              </div>
                              <Badge variant="neutral" className="uppercase font-semibold text-[9px]">
                                Past
                              </Badge>
                            </div>
                          );
                        })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: LEDGER */}
        {activeTab === 'ledger' && (
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-sm font-bold font-heading">Monthly Dues Accrual Ledger</h3>
              <Badge variant={balance > 0 ? 'unpaid' : 'paid'}>
                {balance > 0 ? `₹${balance.toFixed(2)} Pending` : 'Dues Cleared'}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {memberDues.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-12">No dues accrued.</p>
              ) : (
                <div className="table-responsive">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="px-6 py-3">Due Period</th>
                        <th className="px-6 py-3">Subscription Fee</th>
                        <th className="px-6 py-3">Additional Fee (Onam)</th>
                        <th className="px-6 py-3">Total Due</th>
                        <th className="px-6 py-3">Due Status</th>
                        {currentUser.user_permissions.includes(PERMISSIONS.MANAGE_SETTINGS) && (
                          <th className="px-6 py-3 text-right">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {memberDues.map((due) => (
                        <tr key={due.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            {due.month}/{due.year}
                          </td>
                          <td className="px-6 py-4 text-slate-500">₹{due.base_due_amount.toFixed(2)}</td>
                          <td className="px-6 py-4 text-slate-500">₹{due.special_due_amount.toFixed(2)}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">₹{due.total_due_amount.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <Badge variant={due.status === 'PAID' ? 'paid' : due.status === 'WAIVED' ? 'waived' : 'unpaid'}>
                              {due.status}
                            </Badge>
                          </td>
                          {currentUser.user_permissions.includes(PERMISSIONS.MANAGE_SETTINGS) && (
                            <td className="px-6 py-4 text-right">
                              {due.status === 'UNPAID' && (
                                <button
                                  onClick={() => waiveDue(due.id, 'Administrative Waiver')}
                                  className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                                >
                                  Waive Dues
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 3: CHECKOUT */}
        {activeTab === 'checkout' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Arrears and Advance builders */}
            <div className="lg:col-span-2 space-y-6">
              {/* Arrears check block */}
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <h3 className="text-sm font-bold font-heading flex items-center gap-1.5">
                    <AlertCircle className="h-4.5 w-4.5 text-rose-500" />
                    Select Arrears Outstanding Dues
                  </h3>
                  {unpaidDues.length > 0 && (
                    <button
                      onClick={handleSelectAllArrears}
                      className="text-xs text-emerald-600 hover:underline font-semibold cursor-pointer"
                    >
                      {selectedDueIds.length === unpaidDues.length ? 'Clear Selection' : 'Select All'}
                    </button>
                  )}
                </CardHeader>
                <CardContent className="py-4">
                  {unpaidDues.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-slate-100">
                      <CheckCircle className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
                      <p className="text-xs font-semibold text-slate-700">Dues Cleared</p>
                      <p className="text-[10px] text-slate-400 mt-1">No arrears to pay.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                      {unpaidDues.map((due) => {
                        const checked = selectedDueIds.includes(due.id);
                        return (
                          <div
                            key={due.id}
                            onClick={() => handleToggleDueSelect(due.id)}
                            className={`p-3 border rounded-xl flex items-center justify-between text-xs cursor-pointer transition-all ${
                              checked
                                ? 'border-emerald-500 bg-emerald-50/15'
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {}} // Handle click on container instead
                                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <div>
                                <span className="font-bold text-slate-800">{due.month}/{due.year}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  {due.special_due_amount > 0 ? 'Sub + Additional Fee' : 'Monthly Subscription'}
                                </span>
                              </div>
                            </div>
                            <span className="font-bold text-slate-900">
                              ₹{due.total_due_amount.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Advance counter selector */}
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-bold font-heading flex items-center gap-1.5">
                    <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                    Prepay Future Advance Subscription
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-1/3">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Months count
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={advanceCount}
                        onChange={(e) => setAdvanceCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white text-slate-800"
                      />
                    </div>
                    <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100/60 text-xs text-slate-500">
                      <p>Rate: ₹100.00 / month</p>
                      <p className="mt-1">
                        Adding advance months will pre-schedule prepaid billing lines for future periods.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cart Panel summary */}
            <Card className="lg:col-span-1 border-slate-200/80 shadow-md">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <h3 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-1.5">
                  <ShoppingCart className="h-4.5 w-4.5 text-slate-500" />
                  Unified Checkout Cart
                </h3>
              </CardHeader>

              <CardContent className="py-4 space-y-6">
                {/* Cart list items */}
                {selectedDueIds.length === 0 && advanceCount === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Cart is empty. Select dues to start.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {selectedDueIds.map((dueId) => {
                      const due = dues.find((d) => d.id === dueId);
                      if (!due) return null;
                      return (
                        <div key={due.id} className="flex justify-between text-xs border-b border-slate-50 pb-2">
                          <div>
                            <span className="font-semibold text-slate-800">Arrears: {due.month}/{due.year}</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">Cleared Month Due</span>
                          </div>
                          <span className="font-bold text-slate-700">₹{due.total_due_amount.toFixed(2)}</span>
                        </div>
                      );
                    })}
                    {advanceCount > 0 && (
                      <div className="flex justify-between text-xs border-b border-slate-50 pb-2">
                        <div>
                          <span className="font-semibold text-slate-800">Advance: {advanceCount} Months</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Prepay Future Periods</span>
                        </div>
                        <span className="font-bold text-slate-700">₹{totalAdvanceAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Subtotal */}
                <div className="border-t border-slate-150 pt-4 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Checkout Grand Total</span>
                  <span className="text-emerald-700 text-base">₹{basketTotal.toFixed(2)}</span>
                </div>

                {/* Parameters Form */}
                <form onSubmit={handleProcessCheckout} className="space-y-4 pt-4 border-t border-slate-150">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Collection Payment Mode
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none"
                    >
                      <option value="CASH">Cash Drawer</option>
                      <option value="UPI">UPI Payment</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CHEQUE">Cheque Collection</option>
                    </select>
                  </div>

                  {paymentMode !== 'CASH' && (
                    <Input
                      label={`${paymentMode === 'UPI' ? 'UPI' : paymentMode === 'CHEQUE' ? 'Cheque' : 'Bank'} Reference ID`}
                      placeholder={`Enter unique transaction/cheque reference`}
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                    />
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Internal Remarks (Optional)
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add checkout details..."
                      rows={2}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>

                  {checkoutError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-start gap-2 text-left">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                      <span>{checkoutError}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full h-10 font-bold flex items-center gap-1.5"
                    disabled={basketTotal === 0}
                  >
                    <CreditCard className="h-4 w-4" /> Process Checkout &amp; Print
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: RECEIPTS */}
        {activeTab === 'receipts' && (
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold font-heading">Receipt Collections History</h3>
            </CardHeader>
            <CardContent className="p-0">
              {memberReceipts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-12">No receipts issued in database.</p>
              ) : (
                <div className="table-responsive">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="px-6 py-3">Receipt No</th>
                        <th className="px-6 py-3">Payment Date</th>
                        <th className="px-6 py-3">Payment Mode</th>
                        <th className="px-6 py-3">Amount Paid</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {memberReceipts.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-semibold text-slate-800">{tx.receipt_no}</td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(tx.payment_date).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="neutral">{tx.payment_mode}</Badge>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">₹{tx.total_amount.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setActiveReceipt(tx)}
                              className="text-emerald-600 hover:underline font-semibold cursor-pointer"
                            >
                              Reprint Voucher
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}



        {/* TAB 6: TIMELINE */}
        {activeTab === 'timeline' && (
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold font-heading">Activity Audit Trail Timeline</h3>
            </CardHeader>
            <CardContent>
              {memberTimeline.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-12">No activity events recorded.</p>
              ) : (
                <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-6 py-2">
                  {memberTimeline.map((log) => {

                    return (
                      <div key={log.id} className="relative">
                        {/* Timeline dot marker */}
                        <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-slate-200 border-2 border-white" />

                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-semibold text-slate-400">
                              {new Date(log.timestamp).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <Badge className="text-[9px] uppercase px-1.5 py-0" variant="neutral">
                              {log.action_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            {log.action_type === 'MEMBER_REGISTERED' && `Advocate member folder registered in association registry.`}
                            {log.action_type === 'USER_CREATED' && `Security authentication account initialized for username.`}
                            {log.action_type === 'PROFILE_UPDATED' && `Advocate profile settings modified.`}
                            {log.action_type === 'PAYMENT_COLLECTED' && `Cleared payments checkout for total sum of ₹${log.payload.total_amount?.toFixed(2)}.`}
                            {log.action_type === 'LOGIN' && `User authentication log sign in.`}
                            {log.action_type === 'LOGOUT' && `User authentication log sign out.`}
                            {log.action_type === 'SETTINGS_CHANGED' && `Audit status adjustment processed.`}
                          </p>
                          <div className="bg-slate-50 text-[10px] text-slate-400 p-2 rounded border border-slate-100/50 max-w-sm mt-1.5 font-mono">
                            Payload: {JSON.stringify(log.payload)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 7: SECURITY */}
        {activeTab === 'security' && (
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold font-heading">Access &amp; Security Credentials</h3>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSave} className="space-y-4 max-w-md">
                <Input
                  label="New Security Password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {securityError && (
                  <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-lg border border-rose-200">
                    {securityError}
                  </div>
                )}
                {securitySuccess && (
                  <div className="bg-emerald-50 text-emerald-700 text-xs p-3 rounded-lg border border-emerald-250 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Password reset successfully!
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="secondary" className="text-xs">
                    Reset Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
};
