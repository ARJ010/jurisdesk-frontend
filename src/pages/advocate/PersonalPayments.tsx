import React, { useState, useEffect } from 'react';
import { useMockDB } from '@/contexts/MockDBContext';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  FileText, 
  CalendarCheck, 
  ShieldAlert, 
  X, 
  Printer, 
  AlertCircle,
  Upload,
  Clock,
  CheckCircle,
  FileText as FileIcon,
  ExternalLink
} from 'lucide-react';
import type { PaymentTransaction, PaymentMode } from '@/types';
import { usePaymentService } from '@/hooks/usePaymentService';
import { useReportService } from '@/hooks/useReportService';
import { usePaymentRequestService } from '@/hooks/usePaymentRequestService';
import { EmptyState } from '@/components/ui/EmptyState';

export const PersonalPayments: React.FC = () => {
  const { 
    currentUser, 
    advocates, 
    paymentLines,
    users,
    transactions
  } = useMockDB();

  const { getAdvocateDues } = usePaymentService();
  const { getAdvocateReceipts } = useReportService();
  const { 
    paymentRequests, 
    submitRequest, 
    cancelRequest 
  } = usePaymentRequestService();

  const [selectedTx, setSelectedTx] = useState<PaymentTransaction | null>(null);
  
  // Tab Navigation State
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'requests'>('ledger');
  
  // Submit Request Form States
  const [requestMode, setRequestMode] = useState<PaymentMode>('UPI');
  const [requestAmount, setRequestAmount] = useState<string>('0');
  const [requestRefNo, setRequestRefNo] = useState('');
  const [selectedDueIds, setSelectedDueIds] = useState<number[]>([]);
  const [requestAdvanceMonths, setRequestAdvanceMonths] = useState<number>(0);
  const [requestRemarks, setRequestRemarks] = useState('');
  
  // Mock File Upload State
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: string } | null>(null);

  // Errors / Success States
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const advocate = advocates.find((a) => a.user_id === currentUser?.id);
  const dues = advocate ? getAdvocateDues(advocate.id) : [];
  const receipts = advocate ? getAdvocateReceipts(advocate.id) : [];
  const unpaidDues = dues.filter((d) => d.status === 'UNPAID');
  
  // Filter personal requests
  const personalRequests = advocate 
    ? paymentRequests.filter((r) => r.advocate_id === advocate.id)
    : [];

  // Calculate live amount recommendation based on checkbox selection + advances
  useEffect(() => {
    if (!advocate) return;
    const selectedDuesCost = selectedDueIds.reduce((sum, id) => {
      const due = dues.find((d) => d.id === id);
      return sum + (due ? due.total_due_amount : 0);
    }, 0);
    const advanceCost = requestAdvanceMonths * 100.00; // Standard monthly rate
    setRequestAmount((selectedDuesCost + advanceCost).toString());
  }, [selectedDueIds, requestAdvanceMonths, advocate]);

  if (!currentUser || !advocate) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <AlertCircle className="h-10 w-10 text-slate-300 animate-pulse" />
        <p className="mt-2 text-xs">Advocate profile record not found. Please contact administration.</p>
      </div>
    );
  }

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

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Toggle Due Checkbox
  const handleToggleDueCheckbox = (dueId: number) => {
    if (selectedDueIds.includes(dueId)) {
      setSelectedDueIds(selectedDueIds.filter((id) => id !== dueId));
    } else {
      setSelectedDueIds([...selectedDueIds, dueId]);
    }
  };

  // Mock file selection trigger
  const handleMockFileSelect = () => {
    // Generate a mock receipt file name
    const mockFileNames = [
      'GPay_Receipt_Jun25.pdf',
      'SBI_Transfer_Screen.jpg',
      'Bank_Challan_Copy.png',
      'UPI_Transaction_Ref.pdf'
    ];
    const mockMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/pdf'
    ];
    const randomIndex = Math.floor(Math.random() * mockFileNames.length);
    setSelectedFile({
      name: mockFileNames[randomIndex],
      type: mockMimeTypes[randomIndex],
    });
  };

  // Handle Form Submission
  const handleSubmitRequestForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (selectedDueIds.length === 0 && requestAdvanceMonths === 0) {
      setSubmitError('Please select at least one outstanding month or add advance months to checkout.');
      return;
    }
    if (!requestRefNo.trim()) {
      setSubmitError('Transaction Reference Number (UTR / Cheque Number) is required.');
      return;
    }
    const finalAmt = parseFloat(requestAmount);
    if (isNaN(finalAmt) || finalAmt <= 0) {
      setSubmitError('Please specify a valid positive amount.');
      return;
    }

    try {
      // Mock upload proof url
      const proofUrl = selectedFile 
        ? `https://example.com/mock-attachments/${selectedFile.name}`
        : undefined;

      await submitRequest(
        requestMode,
        finalAmt,
        requestRefNo,
        selectedDueIds,
        requestAdvanceMonths,
        requestRemarks,
        proofUrl,
        selectedFile?.name,
        selectedFile?.type
      );

      // Success Reset
      setSubmitSuccess(true);
      setSelectedDueIds([]);
      setRequestAdvanceMonths(0);
      setRequestRefNo('');
      setRequestRemarks('');
      setSelectedFile(null);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit payment request.');
    }
  };

  // Handle Cancel Pending Request
  const handleCancelRequest = async (requestId: string) => {
    if (window.confirm('Are you sure you want to cancel this pending payment request?')) {
      try {
        await cancelRequest(requestId);
      } catch (err: any) {
        alert(err.message || 'Failed to cancel request.');
      }
    }
  };

  // Handle open receipt details modal from request log
  const handleOpenReceipt = (txId: number) => {
    const tx = transactions.find((t) => t.id === txId);
    if (tx) {
      setSelectedTx(tx);
    }
  };

  // Get lines for selected transaction
  const selectedTxLines = selectedTx 
    ? paymentLines.filter((l) => l.transaction_id === selectedTx.id) 
    : [];

  // Get collector name
  const getCollectorName = (collectorId: string) => {
    const collector = users.find((u) => u.id === collectorId);
    return collector ? `${collector.first_name} ${collector.last_name}` : 'Bar Association Cashier';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6 print:hidden">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold font-heading text-slate-900">
              Personal Ledger & Payments
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review your official accounting ledger, submit external payments, and track verification requests.
            </p>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`px-4 py-2 text-xs font-bold -mb-px transition-all border-b-2 cursor-pointer ${
              activeSubTab === 'ledger'
                ? 'border-indigo-650 text-indigo-750 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Ledger &amp; Receipts History
          </button>
          <button
            onClick={() => {
              setActiveSubTab('requests');
              setSubmitSuccess(false);
              setSubmitError(null);
            }}
            className={`px-4 py-2 text-xs font-bold -mb-px transition-all border-b-2 cursor-pointer ${
              activeSubTab === 'requests'
                ? 'border-indigo-650 text-indigo-750 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Payment Verification Requests
          </button>
        </div>

        {activeSubTab === 'ledger' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Outstanding Arrears */}
            <Card className="lg:col-span-1 border-rose-100 bg-rose-50/10">
              <CardHeader className="border-b border-rose-50 bg-rose-50/30">
                <h2 className="text-sm font-bold font-heading text-rose-950 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  Outstanding Arrears
                </h2>
              </CardHeader>
              <CardContent className="py-4">
                {unpaidDues.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-semibold">
                      No Outstanding Dues
                    </span>
                    <p className="text-xs text-slate-400 mt-3">
                      Your account ledger is completely clear.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {unpaidDues.map((due) => (
                      <div
                        key={due.id}
                        className="p-3 bg-white border border-rose-100 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">
                            {due.month}/{due.year}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                            <span>Subscription: ₹{due.base_due_amount}</span>
                            {due.special_due_amount > 0 && (
                              <span className="block">Additional Fee: ₹{due.special_due_amount}</span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-rose-600">
                          ₹{due.total_due_amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right Column: Receipts History */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <h2 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-slate-400" />
                  Receipt Collections History
                </h2>
              </CardHeader>
              <CardContent className="p-0">
                {receipts.length === 0 ? (
                  <EmptyState
                    title="No Receipts Issued"
                    description="You have no payments recorded in the digital ledger."
                    icon={FileText}
                  />
                ) : (
                  <div className="table-responsive">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                          <th className="px-6 py-3">Receipt No</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Payment Mode</th>
                          <th className="px-6 py-3">Total Paid</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {receipts.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-3.5 font-semibold text-slate-800">
                              {tx.receipt_no}
                            </td>
                            <td className="px-6 py-3.5 text-slate-500">
                              {formatDate(tx.payment_date)}
                            </td>
                            <td className="px-6 py-3.5">
                              <Badge variant="neutral">{tx.payment_mode}</Badge>
                            </td>
                            <td className="px-6 py-3.5 font-bold text-slate-800">
                              ₹{tx.total_amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <button 
                                onClick={() => setSelectedTx(tx)}
                                className="text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer hover:underline"
                              >
                                View Voucher
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
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Submit Verification Request Form */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-slate-100">
                <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                  <h2 className="text-sm font-bold font-heading text-slate-800 flex items-center gap-2">
                    <Upload className="h-4 w-4 text-indigo-600" />
                    Submit External Payment
                  </h2>
                </CardHeader>
                <CardContent className="py-4">
                  {submitSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-xs mb-4 flex items-center gap-2 font-semibold">
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-650" />
                      Payment verification request submitted successfully!
                    </div>
                  )}

                  <form onSubmit={handleSubmitRequestForm} className="space-y-4">
                    {/* Dues selection list */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Select Dues to Pay
                      </label>
                      {unpaidDues.length === 0 ? (
                        <p className="text-xs text-emerald-600 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 italic">
                          No arrears pending. Ready for advance pre-payments.
                        </p>
                      ) : (
                        <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                          {unpaidDues.map((due) => {
                            const isChecked = selectedDueIds.includes(due.id);
                            
                            // Check if this due is already in another PENDING request
                            const isAlreadyPending = paymentRequests.some(
                              (r) => r.advocate_id === advocate.id && r.status === 'PENDING' && r.requested_due_ids.includes(due.id)
                            );

                            return (
                              <div 
                                key={due.id} 
                                onClick={() => !isAlreadyPending && handleToggleDueCheckbox(due.id)}
                                className={`flex items-center gap-3 px-3 py-2 text-xs transition-colors select-none ${
                                  isAlreadyPending ? 'bg-slate-50 opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50/50'
                                } ${isChecked ? 'bg-indigo-50/30' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isAlreadyPending}
                                  onChange={() => {}} // Handled by parent click listener
                                  className="h-3.5 w-3.5 accent-slate-900 cursor-pointer rounded"
                                />
                                <div className="flex-1 flex justify-between items-center">
                                  <div>
                                    <span className="font-semibold text-slate-800">
                                      Due for {due.month}/{due.year}
                                    </span>
                                    {isAlreadyPending && (
                                      <span className="text-[9px] text-amber-600 font-semibold block mt-0.5 flex items-center gap-1">
                                        <Clock className="h-2.5 w-2.5" /> Pending Verification
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-bold text-slate-800">₹{due.total_due_amount.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Advance prepayments */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Add Advance Months
                      </label>
                      <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <input
                          type="number"
                          min="0"
                          max="12"
                          value={requestAdvanceMonths}
                          onChange={(e) => setRequestAdvanceMonths(Math.max(0, parseInt(e.target.value) || 0))}
                          className="h-8 w-16 text-center border rounded font-semibold text-xs bg-white"
                        />
                        <span className="text-xs text-slate-500">
                          Pre-pay future months (₹100.00 / month)
                        </span>
                      </div>
                    </div>

                    {/* Method */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Payment Method
                      </label>
                      <select
                        value={requestMode}
                        onChange={(e) => setRequestMode(e.target.value as PaymentMode)}
                        className="w-full h-8 px-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                      >
                        <option value="UPI">UPI / Digital Gateway</option>
                        <option value="BANK_TRANSFER">Bank Transfer (IMPS / NEFT)</option>
                        <option value="CHEQUE">Cheque instrument</option>
                        <option value="CASH">Cash Deposit</option>
                      </select>
                    </div>

                    {/* Reference Number */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Reference Number (UTR / Cheque No)
                      </label>
                      <Input
                        placeholder="e.g. UTR11223344"
                        value={requestRefNo}
                        onChange={(e) => setRequestRefNo(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    {/* Calculated Amount Match */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Amount Paid (₹)
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={requestAmount}
                          onChange={(e) => setRequestAmount(e.target.value)}
                          className="h-8 text-xs pr-20 font-bold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] bg-slate-100 text-slate-500 font-bold uppercase px-1.5 py-0.5 rounded border border-slate-200 select-none">
                          Calculated
                        </span>
                      </div>
                    </div>

                    {/* Proof Upload Area */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Payment Proof Receipt
                      </label>
                      {selectedFile ? (
                        <div className="border border-indigo-150 bg-indigo-50/10 p-2.5 rounded-lg flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <FileIcon className="h-4 w-4 text-indigo-500 shrink-0" />
                            <span className="font-semibold text-slate-700 truncate">{selectedFile.name}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setSelectedFile(null)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={handleMockFileSelect}
                          className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50/50 hover:border-slate-300 transition-all"
                        >
                          <Upload className="h-5 w-5 mx-auto text-slate-450 mb-1" />
                          <span className="text-[11px] font-bold text-slate-600 block">Select Proof Document</span>
                          <span className="text-[9px] text-slate-450 block mt-0.5">Supports PDF or Screenshots (Mock Upload)</span>
                        </div>
                      )}
                    </div>

                    {/* Remarks */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Remarks / Notes
                      </label>
                      <textarea
                        placeholder="Additional remarks..."
                        value={requestRemarks}
                        onChange={(e) => setRequestRemarks(e.target.value)}
                        rows={2}
                        className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white placeholder-slate-400"
                      />
                    </div>

                    {submitError && (
                      <div className="bg-rose-50 border border-rose-250 text-rose-700 text-xs p-2.5 rounded-lg font-semibold flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-650" />
                        {submitError}
                      </div>
                    )}

                    <Button type="submit" className="w-full text-xs font-bold h-8">
                      Submit Request
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Past requests history list */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-slate-100">
                <CardHeader>
                  <h2 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Payment Verification Logs
                  </h2>
                </CardHeader>
                <CardContent className="p-0">
                  {personalRequests.length === 0 ? (
                    <EmptyState
                      title="No Verification Requests"
                      description="You have not submitted any external payments for verification."
                      icon={Clock}
                    />
                  ) : (
                    <div className="table-responsive">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                            <th className="px-4 py-3">Request ID</th>
                            <th className="px-4 py-3">Submitted Date</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Reference No</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Action / Link</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {personalRequests.map((req) => (
                            <tr key={req.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3.5 font-mono font-bold text-slate-800">
                                {req.id}
                              </td>
                              <td className="px-4 py-3.5 text-slate-500">
                                {formatDate(req.submitted_date)}
                              </td>
                              <td className="px-4 py-3.5 font-bold text-slate-900">
                                ₹{req.amount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="space-y-0.5">
                                  <Badge variant="neutral" className="uppercase font-bold text-[8px]">
                                    {req.payment_mode}
                                  </Badge>
                                  <p className="font-mono text-[9px] text-slate-400 select-all">
                                    {req.reference_number}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {req.status === 'PENDING' && (
                                  <div className="flex flex-col items-start gap-0.5 text-[10px]">
                                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                      <span>Submitted / Pending</span>
                                    </div>
                                  </div>
                                )}
                                {req.status === 'APPROVED' && (
                                  <div className="flex flex-col items-start gap-0.5 text-[10px] py-1">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                      <span>Submitted</span>
                                    </div>
                                    <div className="w-px h-2 bg-slate-200 ml-0.75"></div>
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                      <span>Approved</span>
                                    </div>
                                    <div className="w-px h-2 bg-slate-200 ml-0.75"></div>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReceipt(req.generated_transaction_id!)}
                                      className="flex items-center gap-1.5 text-indigo-650 hover:text-indigo-850 hover:underline font-bold cursor-pointer group text-left"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover:scale-110 transition-transform"></span>
                                      <span>Receipt: {req.generated_receipt_number || 'HBA-XXXX-XXXX'}</span>
                                      <ExternalLink className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100" />
                                    </button>
                                  </div>
                                )}
                                {req.status === 'REJECTED' && (
                                  <div className="flex flex-col items-start gap-0.5 text-[10px] py-1">
                                    <div className="flex items-center gap-1.5 text-slate-450">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                      <span>Submitted</span>
                                    </div>
                                    <div className="w-px h-2 bg-slate-200 ml-0.75"></div>
                                    <div className="flex items-center gap-1.5 text-rose-600 font-semibold bg-rose-50 border border-rose-150 px-2 py-0.5 rounded">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                      <span>Rejected</span>
                                    </div>
                                  </div>
                                )}
                                {req.status === 'CANCELLED' && (
                                  <div className="flex flex-col items-start gap-0.5 text-[10px]">
                                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                      <span>Cancelled</span>
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {req.status === 'PENDING' ? (
                                  <button
                                    onClick={() => handleCancelRequest(req.id)}
                                    className="text-rose-650 hover:text-rose-800 hover:underline font-bold text-xs cursor-pointer bg-rose-50/50 hover:bg-rose-50 border border-rose-200/60 rounded px-2.5 py-1 transition-all"
                                  >
                                    Cancel Request
                                  </button>
                                ) : req.status === 'REJECTED' && req.review_notes ? (
                                  <div className="text-[11px] text-rose-650 italic text-right bg-rose-50/30 border border-rose-100/50 p-1.5 rounded max-w-[180px] ml-auto" title={req.review_notes}>
                                    <span className="font-bold uppercase text-[8px] block not-italic text-rose-500 mb-0.5">Rejection Reason:</span>
                                    {req.review_notes}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400">-</span>
                                )}
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
        )}
      </div>

      {/* Receipt Voucher Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
          
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:rounded-none print:w-full print:max-w-none print:max-h-none print:static print:overflow-visible">
            
            {/* Modal Actions Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <span className="font-bold text-slate-800 text-sm">Receipt Voucher Details</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  id="print-trigger"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Printer className="h-4 w-4" />
                  Print Voucher
                </Button>
                <button 
                  onClick={() => setSelectedTx(null)}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Preview Pane */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center print:bg-white print:p-0 print:overflow-visible">
              
              {/* Receipt Voucher Sheet */}
              <div 
                id="printable-receipt"
                className="bg-white border-2 border-slate-800 p-8 w-full max-w-xl shadow-md flex flex-col justify-between text-slate-800 font-sans print:shadow-none print:border-2 print:p-4"
              >
                
                {/* Header */}
                <div className="text-center space-y-1 pb-4 border-b border-slate-300">
                  <h2 className="text-lg font-bold tracking-wide text-slate-900">
                    HOSDURG BAR ASSOCIATION
                  </h2>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Court Road, Kanhangad, Kasaragod, Kerala - 671315
                  </p>
                  <p className="text-[9px] text-slate-400">
                    Phone: +91 467 220 1234 | Email: office@hosdurgbar.org
                  </p>
                </div>

                {/* Sub-Header & Metadata */}
                <div className="py-4 space-y-4">
                  <h3 className="text-center text-xs font-bold tracking-wider text-slate-950 uppercase bg-slate-100 py-1.5 rounded">
                    OFFICIAL RECEIPTS VOUCHER
                  </h3>

                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Receipt No</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedTx.receipt_no}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Date & Time</span>
                      <span className="font-semibold text-slate-850">{formatDateTime(selectedTx.payment_date)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Member Name</span>
                      <span className="font-semibold text-slate-850">Adv. {currentUser.first_name} {currentUser.last_name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Enrolment Roll No</span>
                      <span className="font-semibold text-slate-850">{advocate.enrolment_no}</span>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="py-2">
                  <table className="w-full text-left text-xs border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="px-3 py-2 border-r border-slate-200">Billing Period</th>
                        <th className="px-3 py-2 border-r border-slate-200">Fee Component</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedTxLines.map((line) => (
                        <tr key={line.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 border-r border-slate-200 font-medium text-slate-800">
                            {line.month}/{line.year}
                          </td>
                          <td className="px-3 py-2 border-r border-slate-200 text-slate-500">
                            {line.fee_component === 'SUBSCRIPTION' ? 'Monthly Subscription' : 'Onam contribution'}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-800">
                            ₹{line.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                        <td colSpan={2} className="px-3 py-2 text-right border-r border-slate-200 text-slate-900">Total Paid:</td>
                        <td className="px-3 py-2 text-right text-emerald-700 text-sm">₹{selectedTx.total_amount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Voucher Remarks */}
                <div className="py-3 text-[11px] space-y-1.5 border-b border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Payment Mode:</span>
                    <span className="font-semibold text-slate-800">{selectedTx.payment_mode}</span>
                  </div>
                  {selectedTx.transaction_ref && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Transaction Ref:</span>
                      <span className="font-semibold text-slate-800">{selectedTx.transaction_ref}</span>
                    </div>
                  )}
                  {selectedTx.remarks && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Remarks:</span>
                      <span className="font-semibold text-slate-800">{selectedTx.remarks}</span>
                    </div>
                  )}
                </div>

                {/* Footer Signatures */}
                <div className="flex justify-between pt-8 text-center text-[10px]">
                  <div>
                    <span className="text-slate-400 block mb-4">Issued By:</span>
                    <span className="font-semibold text-slate-900 border-t border-slate-300 pt-1 block">{getCollectorName(selectedTx.collected_by_id)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block mb-4">Authorized Signature:</span>
                    <span className="font-semibold text-slate-900 border-t border-slate-300 pt-1 px-4 block">Treasurer / Cashier</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Global Print Media styles injecting */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: auto;
                margin: 20mm;
              }
              body {
                background: white !important;
              }
              #printable-receipt {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 auto !important;
                padding: 24px !important;
                box-sizing: border-box !important;
                border: 2px solid #1e293b !important;
                box-shadow: none !important;
                background: white !important;
              }
            }
          `}} />
        </div>
      )}
    </div>
  );
};
