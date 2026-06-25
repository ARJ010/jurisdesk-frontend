import React, { useState } from 'react';
import { useMockDB } from '@/contexts/MockDBContext';
import { usePaymentRequestService } from '@/hooks/usePaymentRequestService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  FileText, 
  Search, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  AlertTriangle,
  Receipt,
  Download,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

export const PaymentRequestsPage: React.FC = () => {
  const { users, advocates, getAdvocateDues, transactions, settings } = useMockDB();
  const { paymentRequests, approveRequest, rejectRequest } = usePaymentRequestService();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'>('ALL');
  
  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [approvedDueIds, setApprovedDueIds] = useState<number[]>([]);
  const [approvedAdvanceCount, setApprovedAdvanceCount] = useState<number>(0);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  
  // Selected Receipt Modal State (for previewing generated receipt directly)
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);

  // Helper: Find advocate info
  const getAdvocateDetails = (advocateId: string) => {
    const advocate = advocates.find((a) => a.id === advocateId);
    const user = users.find((u) => u.id === advocate?.user_id);
    return {
      name: user ? `${user.first_name} ${user.last_name}` : 'Unknown Member',
      enrolment: advocate?.enrolment_no || 'N/A',
      picture: user ? user.first_name[0] + user.last_name[0] : '??',
    };
  };

  // Helper: Get calculated approved total
  const getApprovedTotal = (dueIds: number[], advanceCount: number) => {
    const duesCost = dueIds.reduce((sum, id) => {
      const due = selectedRequest ? getAdvocateDues(selectedRequest.advocate_id).find((d) => d.id === id) : null;
      return sum + (due ? due.total_due_amount : 0);
    }, 0);
    const advanceCost = advanceCount * 100.00; // Standard monthly base rate
    return duesCost + advanceCost;
  };

  // Open Review Panel
  const handleOpenReview = (request: any) => {
    setSelectedRequest(request);
    setApprovedDueIds([...request.requested_due_ids]);
    setApprovedAdvanceCount(request.requested_advance_months);
    setReviewNotes('');
    setRejectionReason('');
    setIsRejecting(false);
    setActionError(null);
  };

  // Toggle Due ID selection for approval
  const handleToggleDueId = (dueId: number) => {
    if (approvedDueIds.includes(dueId)) {
      setApprovedDueIds(approvedDueIds.filter((id) => id !== dueId));
    } else {
      setApprovedDueIds([...approvedDueIds, dueId]);
    }
  };

  // Process Approval
  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    // Check if allocation changed and remarks are entered
    const isAllocationChanged = 
      JSON.stringify(selectedRequest.requested_due_ids.sort()) !== JSON.stringify(approvedDueIds.sort()) ||
      selectedRequest.requested_advance_months !== approvedAdvanceCount;
      
    if (isAllocationChanged && !reviewNotes.trim()) {
      setActionError('Remarks are required whenever the approved allocation differs from the request.');
      return;
    }
    
    try {
      setActionError(null);
      await approveRequest(
        selectedRequest.id,
        approvedDueIds,
        approvedAdvanceCount,
        reviewNotes
      );
      setSelectedRequest(null);
    } catch (err: any) {
      setActionError(err.message || 'Approval checkout failed.');
    }
  };

  // Process Rejection
  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      setActionError('Please enter a reason for rejecting this request.');
      return;
    }
    
    try {
      setActionError(null);
      await rejectRequest(selectedRequest.id, rejectionReason);
      setSelectedRequest(null);
    } catch (err: any) {
      setActionError(err.message || 'Rejection failed.');
    }
  };

  // Open Generated Receipt preview
  const handleOpenReceipt = (txId: number) => {
    const tx = transactions.find((t) => t.id === txId);
    if (tx) {
      setActiveReceipt(tx);
    }
  };

  // Filter requests
  const filteredRequests = paymentRequests.filter((r) => {
    const details = getAdvocateDetails(r.advocate_id);
    const matchesSearch = 
      details.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      details.enrolment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Sibling Page Content Wrapper */}
      <div className="space-y-6 print:hidden">
        {/* Page Header */}
        <div>
          <h1 className="text-xl font-bold font-heading text-slate-900">
            Advocate Payment Requests
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review self-submitted advocate payments, reconcile bank transfers, adjust allocations, and authorize receipt generation.
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="border-slate-100">
          <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search ID, advocate, ref number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            
            <div className="flex gap-1.5 overflow-x-auto pb-px">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    statusFilter === status
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm font-extrabold'
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <Card className="border-slate-100 overflow-hidden">
          <CardContent className="p-0">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <FileText className="h-10 w-10 mx-auto text-slate-350 mb-3" />
                <p className="font-semibold text-sm">No payment requests found</p>
                <p className="text-xs text-slate-400 mt-1">Try resetting search filters or check back later.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="px-6 py-3">Request ID</th>
                      <th className="px-6 py-3">Advocate</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Method &amp; Ref</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map((req) => {
                      const details = getAdvocateDetails(req.advocate_id);
                      return (
                        <tr key={req.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-slate-800">
                            {req.id}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 shadow-inner">
                                {details.picture}
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-850">{details.name}</h4>
                                <p className="text-[10px] text-slate-400">Roll: {details.enrolment}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              {new Date(req.submitted_date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">
                            ₹{req.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-0.5">
                              <Badge variant="neutral" className="uppercase font-bold text-[8px] tracking-wide">
                                {req.payment_mode}
                              </Badge>
                              <p className="font-mono text-[10px] text-slate-400 select-all" title={req.reference_number}>
                                {req.reference_number}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge 
                              variant={
                                req.status === 'APPROVED' ? 'paid' :
                                req.status === 'PENDING' ? 'unpaid' :
                                req.status === 'REJECTED' ? 'unpaid' : 'neutral'
                              }
                              className={`uppercase tracking-wide text-[8px] font-bold ${
                                req.status === 'REJECTED' ? 'bg-rose-50 border-rose-200 text-rose-700' : ''
                              }`}
                            >
                              {req.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {req.status === 'PENDING' ? (
                              <Button
                                onClick={() => handleOpenReview(req)}
                                size="sm"
                                variant="secondary"
                                className="text-xs h-7 px-3 flex items-center gap-1 ml-auto"
                              >
                                Review <ChevronRight className="h-3 w-3" />
                              </Button>
                            ) : (
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  onClick={() => handleOpenReview(req)}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 px-2.5 bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                                >
                                  Details
                                </Button>
                                {req.status === 'APPROVED' && req.generated_transaction_id && (
                                  <Button
                                    onClick={() => handleOpenReceipt(req.generated_transaction_id!)}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 px-2.5 border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1"
                                  >
                                    <Receipt className="h-3 w-3" /> Receipt
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 1. Modal Overlay for Reviewing Request */}
      {selectedRequest && (() => {
        const details = getAdvocateDetails(selectedRequest.advocate_id);
        const allDues = getAdvocateDues(selectedRequest.advocate_id);
        const unpaidDues = allDues.filter(
          (d) => d.status === 'UNPAID' || selectedRequest.requested_due_ids.includes(d.id)
        );
        const calculatedApprovedTotal = getApprovedTotal(approvedDueIds, approvedAdvanceCount);
        const isPending = selectedRequest.status === 'PENDING';
        
        // Check if allocation differs
        const isAllocationChanged = 
          JSON.stringify(selectedRequest.requested_due_ids.sort()) !== JSON.stringify(approvedDueIds.sort()) ||
          selectedRequest.requested_advance_months !== approvedAdvanceCount;
          
        const isTotalMatching = selectedRequest.amount === calculatedApprovedTotal;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:hidden">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-slate-500" />
                  Payment Verification Portal ({selectedRequest.id})
                </span>
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Side: Submitted Payment Details (Immutable) */}
                <div className="space-y-4">
                  <div className="border-b border-slate-150 pb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Submitted Advocate</h3>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-base shadow-inner">
                        {details.picture}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{details.name}</h4>
                        <p className="text-xs text-slate-500">Enrollment Number: {details.enrolment}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">External Payment Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">PAYMENT MODE</span>
                        <span className="font-semibold text-slate-800 uppercase">{selectedRequest.payment_mode}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">SUBMITTED AMOUNT</span>
                        <span className="font-bold text-slate-900 text-sm">₹{selectedRequest.amount.toFixed(2)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">REFERENCE NUMBER (UTR)</span>
                        <span className="font-mono text-slate-800 font-semibold bg-white border px-1.5 py-0.5 rounded">{selectedRequest.reference_number}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">SUBMISSION DATE</span>
                        <span className="font-semibold text-slate-850">
                          {new Date(selectedRequest.submitted_date).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">STATUS</span>
                        <Badge 
                          variant={
                            selectedRequest.status === 'APPROVED' ? 'paid' :
                            selectedRequest.status === 'PENDING' ? 'unpaid' : 'neutral'
                          }
                          className="uppercase font-bold tracking-wider text-[8px] mt-0.5"
                        >
                          {selectedRequest.status}
                        </Badge>
                      </div>
                    </div>

                    {selectedRequest.remarks && (
                      <div className="pt-2 border-t border-slate-150">
                        <span className="text-slate-400 block text-[10px]">MEMBER REMARKS</span>
                        <p className="text-slate-700 italic text-xs mt-0.5">{selectedRequest.remarks}</p>
                      </div>
                    )}

                    {selectedRequest.proof_attachment_url && (
                      <div className="pt-2 border-t border-slate-150 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">PROOF ATTACHMENT</span>
                          {selectedRequest.mime_type && (
                            <span className="text-[9px] text-slate-450 mt-0.5 block">
                              Format: {selectedRequest.mime_type}
                            </span>
                          )}
                        </div>
                        <a 
                          href={selectedRequest.proof_attachment_url} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-650 hover:text-indigo-850 font-semibold flex items-center gap-1 hover:underline mt-0.5"
                        >
                          <Download className="h-3.5 w-3.5" /> 
                          {selectedRequest.original_file_name || 'Proof.pdf'}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Requested Allocations */}
                  <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Requested Allocation</h3>
                    {selectedRequest.requested_due_ids.length === 0 && selectedRequest.requested_advance_months === 0 ? (
                      <p className="text-xs text-slate-500">No specific dues requested. Generic deposit.</p>
                    ) : (
                      <div className="space-y-1.5 text-xs text-slate-750">
                        {selectedRequest.requested_due_ids.map((dueId: number) => {
                          const due = allDues.find((d) => d.id === dueId);
                          return due ? (
                            <div key={dueId} className="flex justify-between border-b border-slate-100 pb-1">
                              <span>Monthly Subscription ({due.month}/{due.year})</span>
                              <span className="font-semibold text-slate-800">₹{due.total_due_amount.toFixed(2)}</span>
                            </div>
                          ) : null;
                        })}
                        {selectedRequest.requested_advance_months > 0 && (
                          <div className="flex justify-between">
                            <span>Advance Subscription ({selectedRequest.requested_advance_months} months)</span>
                            <span className="font-semibold text-slate-800">
                              ₹{(selectedRequest.requested_advance_months * 100).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Review Summary (Read-only if approved or rejected) */}
                  {!isPending && (
                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-2 text-xs">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Review Summary</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-400 block text-[9px]">REVIEWER</span>
                          <span className="font-semibold text-slate-800">
                            {users.find((u) => u.id === selectedRequest.reviewed_by)?.first_name || 'Staff / Admin'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">REVIEWED AT</span>
                          <span className="font-semibold text-slate-850">
                            {selectedRequest.reviewed_at ? new Date(selectedRequest.reviewed_at).toLocaleString('en-IN') : 'N/A'}
                          </span>
                        </div>
                        {selectedRequest.review_notes && (
                          <div className="col-span-2 pt-2 border-t border-slate-150">
                            <span className="text-slate-400 block text-[9px] uppercase">Review Notes / Remarks</span>
                            <p className="text-slate-700 italic mt-0.5">{selectedRequest.review_notes}</p>
                          </div>
                        )}
                        {selectedRequest.generated_receipt_number && (
                          <div className="col-span-2 pt-2 border-t border-slate-150 flex items-center justify-between">
                            <div>
                              <span className="text-slate-400 block text-[9px]">OFFICIAL RECEIPT</span>
                              <span className="font-bold text-slate-800">{selectedRequest.generated_receipt_number}</span>
                            </div>
                            <Button 
                              size="sm"
                              variant="outline" 
                              onClick={() => handleOpenReceipt(selectedRequest.generated_transaction_id!)}
                              className="text-[10px] h-6 px-2.5 border-indigo-100 bg-indigo-50 text-indigo-700 flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" /> View Voucher
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Reconcile / Allocation Actions */}
                <div className="border-l border-slate-100 pl-0 md:pl-6 space-y-4">
                  {isPending ? (
                    <>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Official Allocation Review</h3>
                      
                      {!isRejecting ? (
                        <div className="space-y-4">
                          {/* Checklist of outstanding dues */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Approved Outstanding Dues
                            </label>
                            {unpaidDues.length === 0 ? (
                              <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                                No outstanding arrears pending.
                              </p>
                            ) : (
                              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-slate-100">
                                {unpaidDues.map((due) => {
                                  const isChecked = approvedDueIds.includes(due.id);
                                  return (
                                    <div 
                                      key={due.id} 
                                      onClick={() => handleToggleDueId(due.id)}
                                      className={`flex items-center gap-3 px-4 py-2.5 text-xs transition-colors cursor-pointer select-none ${
                                        isChecked ? 'bg-slate-50' : 'hover:bg-slate-50/50'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {}} // Controlled by parent click handler
                                        className="h-4 w-4 accent-slate-900 cursor-pointer rounded border-slate-300"
                                      />
                                      <div className="flex-1 flex justify-between items-center">
                                        <div>
                                          <span className="font-semibold text-slate-800">
                                            Subscription ({due.month}/{due.year})
                                          </span>
                                          {due.special_due_amount > 0 && (
                                            <span className="text-[10px] text-slate-400 block mt-0.5">
                                              Includes Additional Fee: ₹{due.special_due_amount.toFixed(2)}
                                            </span>
                                          )}
                                        </div>
                                        <span className="font-bold text-slate-900">
                                          ₹{due.total_due_amount.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Advance months selector */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                              Approved Advance Months
                            </label>
                            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-150">
                              <input
                                type="number"
                                min="0"
                                max="12"
                                value={approvedAdvanceCount}
                                onChange={(e) => setApprovedAdvanceCount(Math.max(0, parseInt(e.target.value) || 0))}
                                className="h-9 w-20 text-center border border-slate-200 rounded-lg text-xs font-bold bg-white"
                              />
                              <div className="text-xs text-slate-500">
                                <span className="font-semibold block text-slate-800">Advance Subscriptions</span>
                                Pre-pay monthly dues at standard rate (₹100/mo)
                              </div>
                            </div>
                          </div>

                          {/* Live Reconciliation summary */}
                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 space-y-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reconciliation Summary</h4>
                            <div className="grid grid-cols-2 gap-y-2 text-xs">
                              <div className="flex flex-col">
                                <span className="text-slate-450 block text-[9px] uppercase tracking-wide">Advocate Paid</span>
                                <span className="font-extrabold text-slate-800 text-sm">₹{selectedRequest.amount.toFixed(2)}</span>
                              </div>
                              <div className="flex flex-col text-right">
                                <span className="text-slate-450 block text-[9px] uppercase tracking-wide">Approved Allocation Cost</span>
                                <span className="font-extrabold text-slate-800 text-sm">₹{calculatedApprovedTotal.toFixed(2)}</span>
                              </div>
                              
                              <div className="col-span-2 pt-2.5 border-t border-slate-150 flex items-center justify-between">
                                <span className="font-semibold">Match Status:</span>
                                {isTotalMatching ? (
                                  <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                                    <CheckCircle className="h-3 w-3" /> ✓ Matches
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">
                                    <AlertTriangle className="h-3 w-3" /> Allocation changed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Review notes input */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Review Notes &amp; Remarks {isAllocationChanged && <span className="text-rose-600">*</span>}
                            </label>
                            <textarea
                              placeholder={
                                isAllocationChanged 
                                  ? "Dues allocation differs. Remarks are required..." 
                                  : "Reconciliation verified. Ready for approval..."
                              }
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              rows={3}
                              className="w-full p-3 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white placeholder-slate-400"
                            />
                            {isAllocationChanged && !reviewNotes.trim() && (
                              <p className="text-[10px] font-semibold text-amber-600 flex items-center gap-1">
                                <Info className="h-3 w-3 shrink-0" /> Remarks are required for changed allocations.
                              </p>
                            )}
                          </div>

                          {/* Action Errors */}
                          {actionError && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-3 text-xs">
                              {actionError}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2.5 justify-end pt-2">
                            <Button 
                              onClick={() => setIsRejecting(true)}
                              variant="outline" 
                              className="text-xs h-9 text-rose-700 hover:text-rose-800 border-rose-100 hover:bg-rose-50"
                            >
                              Reject Request
                            </Button>
                            <Button 
                              onClick={handleApprove}
                              disabled={isAllocationChanged && !reviewNotes.trim()}
                              className="text-xs h-9 px-5 bg-emerald-650 hover:bg-emerald-700 text-white font-bold"
                            >
                              Approve &amp; Checkout
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Rejection Remarks Form */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-rose-750 uppercase tracking-wider block">
                              Rejection Reason *
                            </label>
                            <textarea
                              placeholder="Cheque bounced, incorrect reference UTR, invalid deposit attachment..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              rows={4}
                              className="w-full p-3 border border-rose-150 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 bg-rose-50/5 placeholder-slate-400"
                            />
                          </div>

                          {/* Action Errors */}
                          {actionError && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-3 text-xs">
                              {actionError}
                            </div>
                          )}

                          {/* Buttons */}
                          <div className="flex gap-2.5 justify-end pt-2">
                            <Button 
                              onClick={() => { setIsRejecting(false); setActionError(null); }}
                              variant="outline" 
                              className="text-xs h-9 bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            >
                              Back
                            </Button>
                            <Button 
                              onClick={handleReject}
                              disabled={!rejectionReason.trim()}
                              className="text-xs h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                            >
                              Submit Rejection
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full text-slate-400 py-12">
                      <CheckCircle className={`h-12 w-12 mb-3 ${
                        selectedRequest.status === 'APPROVED' ? 'text-emerald-500' :
                        selectedRequest.status === 'REJECTED' ? 'text-rose-500' : 'text-slate-400'
                      }`} />
                      <p className="font-semibold text-slate-800 text-sm">
                        Request has been {selectedRequest.status.toLowerCase()}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        This workflow record is now immutable. Ledger transactions and receipts are sealed.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 2. Modal Overlay for generated receipt preview (Direct reprint voucher style) */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 print:p-0 print:bg-white print:static print:overflow-visible">
          <Card className="w-full max-w-2xl bg-white shadow-2xl relative print:shadow-none print:border-none print:w-full print:max-w-none print:static print:overflow-visible print:max-h-none">
            {/* Close button - hidden on print */}
            <button
              onClick={() => setActiveReceipt(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer print:hidden"
            >
              <XCircle className="h-5 w-5" />
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
                  <h4 className="font-bold text-slate-800">
                    {(() => {
                      const details = getAdvocateDetails(activeReceipt.advocate_id);
                      return details.name;
                    })()}
                  </h4>
                  <p className="text-slate-500">
                    Roll No:{' '}
                    {(() => {
                      const details = getAdvocateDetails(activeReceipt.advocate_id);
                      return details.enrolment;
                    })()}
                  </p>
                </div>
              </div>

              {/* Remarks */}
              {activeReceipt.remarks && (
                <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 italic text-slate-650">
                  Remarks: {activeReceipt.remarks}
                </div>
              )}

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
          </Card>
        </div>
      )}
    </div>
  );
};
