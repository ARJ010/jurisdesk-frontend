import { useMockDB } from '@/contexts/MockDBContext';
import { STORAGE_KEYS } from '@/config/storage';
import type { PaymentRequest, PaymentMode } from '@/types';
import { usePaymentService } from './usePaymentService';

export const usePaymentRequestService = () => {
  const {
    currentUser,
    paymentRequests,
    setPaymentRequests,
    activityLogs,
    setActivityLogs,
    advocates,
  } = useMockDB();

  const { checkoutBasket } = usePaymentService();

  // Find advocate ID for currently logged-in user
  const currentAdvocate = advocates.find((a) => a.user_id === currentUser?.id);

  // Submit payment request
  const submitRequest = async (
    mode: PaymentMode,
    amount: number,
    refNo: string,
    requestedDueIds: number[],
    requestedAdvanceMonths: number,
    remarks?: string,
    proofUrl?: string,
    fileName?: string,
    mimeType?: string
  ) => {
    if (!currentUser || !currentAdvocate) {
      throw new Error('Not authenticated as an advocate.');
    }

    // 1. Prevent duplicate active reference numbers (UTR/Cheque)
    const duplicateRef = paymentRequests.find(
      (r) =>
        r.reference_number.toLowerCase().trim() === refNo.toLowerCase().trim() &&
        (r.status === 'PENDING' || r.status === 'APPROVED')
    );
    if (duplicateRef) {
      throw new Error(`A payment request with reference number "${refNo}" is already pending or approved.`);
    }

    // 2. Prevent duplicate pending requests for the same dues
    const activeDuesRequestMap = new Set<number>();
    paymentRequests
      .filter((r) => r.advocate_id === currentAdvocate.id && r.status === 'PENDING')
      .forEach((r) => r.requested_due_ids.forEach((id) => activeDuesRequestMap.add(id)));

    const hasOverlap = requestedDueIds.some((id) => activeDuesRequestMap.has(id));
    if (hasOverlap) {
      throw new Error('One or more of the selected dues are already pending validation in another payment request.');
    }

    // Generate Request ID: REQ-00000X
    const nextId = paymentRequests.length > 0
      ? Math.max(...paymentRequests.map((r) => parseInt(r.id.split('-')[1]) || 0)) + 1
      : 1;
    const reqId = `REQ-${nextId.toString().padStart(6, '0')}`;

    const newRequest: PaymentRequest = {
      id: reqId,
      advocate_id: currentAdvocate.id,
      submitted_date: new Date().toISOString(),
      payment_mode: mode,
      amount,
      reference_number: refNo,
      remarks,
      status: 'PENDING',
      requested_due_ids: requestedDueIds,
      requested_advance_months: requestedAdvanceMonths,
      proof_attachment_url: proofUrl,
      original_file_name: fileName,
      mime_type: mimeType,
    };

    const newRequests = [...paymentRequests, newRequest];
    setPaymentRequests(newRequests);
    localStorage.setItem(STORAGE_KEYS.PAYMENT_REQUESTS, JSON.stringify(newRequests));

    // Log Activity
    const nextLogId = activityLogs.length > 0 ? Math.max(...activityLogs.map((l) => l.id)) + 1 : 1;
    const newLog = {
      id: nextLogId,
      timestamp: new Date().toISOString(),
      advocate_id: currentAdvocate.id,
      action_type: 'PAYMENT_REQUEST_SUBMITTED' as const,
      performed_by_id: currentUser.id,
      payload: {
        request_id: reqId,
        amount,
        payment_mode: mode,
        reference_number: refNo,
      },
    };
    const newLogs = [...activityLogs, newLog];
    setActivityLogs(newLogs);
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(newLogs));

    return newRequest;
  };

  // Approve payment request
  const approveRequest = async (
    requestId: string,
    approvedDueIds: number[],
    approvedAdvanceMonths: number,
    reviewNotes?: string
  ) => {
    if (!currentUser) throw new Error('Not authenticated');

    const requestIndex = paymentRequests.findIndex((r) => r.id === requestId);
    if (requestIndex === -1) throw new Error('Payment request not found');

    const request = paymentRequests[requestIndex];
    if (request.status !== 'PENDING') throw new Error('Only pending requests can be approved');

    // Execute the unified checkout basket using existing checkout service
    // Note: checkoutBasket will create transaction, lines, and update dues
    const receipt = await checkoutBasket(
      request.advocate_id,
      approvedDueIds,
      approvedAdvanceMonths,
      request.payment_mode,
      request.reference_number,
      reviewNotes || request.remarks || 'Approved payment request checkout'
    );

    // Update request details and status
    const updatedRequest: PaymentRequest = {
      ...request,
      status: 'APPROVED',
      approved_due_ids: approvedDueIds,
      approved_advance_months: approvedAdvanceMonths,
      reviewed_by: currentUser.id,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes,
      generated_transaction_id: receipt.id,
      generated_receipt_number: receipt.receipt_no,
    };

    const newRequests = [...paymentRequests];
    newRequests[requestIndex] = updatedRequest;
    setPaymentRequests(newRequests);
    localStorage.setItem(STORAGE_KEYS.PAYMENT_REQUESTS, JSON.stringify(newRequests));

    // Log approval activity
    const nextLogId = activityLogs.length > 0 ? Math.max(...activityLogs.map((l) => l.id)) + 1 : 1;
    const newLog = {
      id: nextLogId,
      timestamp: new Date().toISOString(),
      advocate_id: request.advocate_id,
      action_type: 'PAYMENT_REQUEST_APPROVED' as const,
      performed_by_id: currentUser.id,
      payload: {
        request_id: requestId,
        receipt_no: receipt.receipt_no,
        amount: request.amount,
        approved_due_ids: approvedDueIds,
        approved_advance_months: approvedAdvanceMonths,
      },
    };
    const newLogs = [...activityLogs, newLog];
    setActivityLogs(newLogs);
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(newLogs));

    return updatedRequest;
  };

  // Reject payment request
  const rejectRequest = async (requestId: string, reason: string) => {
    if (!currentUser) throw new Error('Not authenticated');

    const requestIndex = paymentRequests.findIndex((r) => r.id === requestId);
    if (requestIndex === -1) throw new Error('Payment request not found');

    const request = paymentRequests[requestIndex];
    if (request.status !== 'PENDING') throw new Error('Only pending requests can be rejected');

    const updatedRequest: PaymentRequest = {
      ...request,
      status: 'REJECTED',
      reviewed_by: currentUser.id,
      reviewed_at: new Date().toISOString(),
      review_notes: reason,
    };

    const newRequests = [...paymentRequests];
    newRequests[requestIndex] = updatedRequest;
    setPaymentRequests(newRequests);
    localStorage.setItem(STORAGE_KEYS.PAYMENT_REQUESTS, JSON.stringify(newRequests));

    // Log rejection activity
    const nextLogId = activityLogs.length > 0 ? Math.max(...activityLogs.map((l) => l.id)) + 1 : 1;
    const newLog = {
      id: nextLogId,
      timestamp: new Date().toISOString(),
      advocate_id: request.advocate_id,
      action_type: 'PAYMENT_REQUEST_REJECTED' as const,
      performed_by_id: currentUser.id,
      payload: {
        request_id: requestId,
        rejection_reason: reason,
      },
    };
    const newLogs = [...activityLogs, newLog];
    setActivityLogs(newLogs);
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(newLogs));

    return updatedRequest;
  };

  // Cancel payment request
  const cancelRequest = async (requestId: string) => {
    if (!currentUser) throw new Error('Not authenticated');

    const requestIndex = paymentRequests.findIndex((r) => r.id === requestId);
    if (requestIndex === -1) throw new Error('Payment request not found');

    const request = paymentRequests[requestIndex];
    if (request.status !== 'PENDING') throw new Error('Only pending requests can be cancelled');
    if (request.advocate_id !== currentAdvocate?.id) {
      throw new Error('You can only cancel your own requests');
    }

    const updatedRequest: PaymentRequest = {
      ...request,
      status: 'CANCELLED',
    };

    const newRequests = [...paymentRequests];
    newRequests[requestIndex] = updatedRequest;
    setPaymentRequests(newRequests);
    localStorage.setItem(STORAGE_KEYS.PAYMENT_REQUESTS, JSON.stringify(newRequests));

    // Log cancellation activity
    const nextLogId = activityLogs.length > 0 ? Math.max(...activityLogs.map((l) => l.id)) + 1 : 1;
    const newLog = {
      id: nextLogId,
      timestamp: new Date().toISOString(),
      advocate_id: currentAdvocate.id,
      action_type: 'PAYMENT_REQUEST_CANCELLED' as const,
      performed_by_id: currentUser.id,
      payload: {
        request_id: requestId,
      },
    };
    const newLogs = [...activityLogs, newLog];
    setActivityLogs(newLogs);
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(newLogs));

    return updatedRequest;
  };

  return {
    paymentRequests,
    currentAdvocate,
    submitRequest,
    approveRequest,
    rejectRequest,
    cancelRequest,
  };
};
