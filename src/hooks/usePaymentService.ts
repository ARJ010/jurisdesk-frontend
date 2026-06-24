import { useMockDB } from '@/contexts/MockDBContext';
import { calculateCheckout, calculateWaiver } from '@/services/paymentService';
import { STORAGE_KEYS } from '@/config/storage';
import type { PaymentMode } from '@/types';

export const usePaymentService = () => {
  const {
    currentUser,
    dues,
    setDues,
    transactions,
    setTransactions,
    paymentLines,
    setPaymentLines,
    activityLogs,
    setActivityLogs,
    settings,
    getAdvocateDueBalance,
    getAdvocateDues,
    additionalFeeRules,
    advocates,
  } = useMockDB();

  const checkoutBasket = async (
    advocateId: string,
    dueIds: number[],
    advanceMonthsCount: number,
    paymentMode: PaymentMode,
    transactionRef: string | null,
    remarks: string | null
  ) => {
    const advocate = advocates.find((a) => a.id === advocateId);
    if (!advocate) throw new Error('Advocate profile not found.');

    const result = calculateCheckout(
      dues,
      transactions,
      paymentLines,
      activityLogs,
      settings,
      currentUser,
      advocateId,
      dueIds,
      advanceMonthsCount,
      paymentMode,
      transactionRef,
      remarks,
      additionalFeeRules,
      advocate
    );

    const newTransactions = [...transactions, result.newTransaction];
    const newPaymentLines = [...paymentLines, ...result.newLines];
    const newLogs = [...activityLogs, result.newLog];

    setDues(result.updatedDues);
    setTransactions(newTransactions);
    setPaymentLines(newPaymentLines);
    setActivityLogs(newLogs);

    localStorage.setItem(STORAGE_KEYS.DUES, JSON.stringify(result.updatedDues));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(newTransactions));
    localStorage.setItem(STORAGE_KEYS.PAYMENT_LINES, JSON.stringify(newPaymentLines));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(newLogs));

    return result.newTransaction;
  };

  const waiveDue = (dueId: number, remarks: string) => {
    const result = calculateWaiver(
      dues,
      activityLogs,
      currentUser,
      dueId,
      remarks
    );
    if (!result) return;

    const newLogs = [...activityLogs, result.newLog];

    setDues(result.updatedDues);
    setActivityLogs(newLogs);

    localStorage.setItem(STORAGE_KEYS.DUES, JSON.stringify(result.updatedDues));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(newLogs));
  };

  return {
    getAdvocateDueBalance,
    getAdvocateDues,
    checkoutBasket,
    waiveDue,
  };
};
