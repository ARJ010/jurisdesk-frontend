import type { 
  MonthlyDue, 
  PaymentTransaction, 
  PaymentLine, 
  ActivityLog, 
  AssociationSettings, 
  User, 
  PaymentMode,
  AdditionalFeeRule,
  Advocate
} from '@/types';

/**
 * Helper to calculate dynamic special dues for a given period based on special fee entities.
 */
export const calculateAdditionalDuesForPeriod = (
  additionalFeeRules: AdditionalFeeRule[],
  year: number,
  monthStr: string,
  joinDateStr: string
): number => {
  const joinDate = new Date(joinDateStr);
  const startYear = joinDate.getFullYear();
  const startMonthStr = (joinDate.getMonth() + 1).toString().padStart(2, '0');
  const monthNum = parseInt(monthStr);
  const billingDateStr = `${year}-${monthStr}-01`;

  let totalSpecial = 0;
  additionalFeeRules.forEach((fee) => {
    if (!fee.active || !fee.mandatory) return;
    if (fee.effective_from && billingDateStr < fee.effective_from) return;
    if (fee.effective_until && billingDateStr > fee.effective_until) return;

    if (fee.frequency === 'YEARLY' && monthStr === fee.month) {
      if (fee.applies_to === 'ALL_ACTIVE_MEMBERS' || (fee.applies_to === 'NEW_MEMBERS' && year === startYear)) {
        totalSpecial += fee.amount;
      }
    } else if (fee.frequency === 'MONTHLY') {
      if (fee.applies_to === 'ALL_ACTIVE_MEMBERS' || (fee.applies_to === 'NEW_MEMBERS' && year === startYear)) {
        totalSpecial += fee.amount;
      }
    } else if (fee.frequency === 'QUARTERLY' && monthNum % 3 === 0) {
      if (fee.applies_to === 'ALL_ACTIVE_MEMBERS' || (fee.applies_to === 'NEW_MEMBERS' && year === startYear)) {
        totalSpecial += fee.amount;
      }
    } else if (fee.frequency === 'ONE_TIME' && year === startYear && monthStr === startMonthStr) {
      if (fee.applies_to === 'NEW_MEMBERS' || fee.applies_to === 'ALL_ACTIVE_MEMBERS') {
        totalSpecial += fee.amount;
      }
    }
  });

  return totalSpecial;
};

/**
 * Pure function to calculate a counter checkout transaction and advance subscription prepayments.
 */
export const calculateCheckout = (
  dues: MonthlyDue[],
  transactions: PaymentTransaction[],
  paymentLines: PaymentLine[],
  activityLogs: ActivityLog[],
  settings: AssociationSettings,
  currentUser: User | null,
  advocateId: string,
  dueIds: number[],
  advanceMonthsCount: number,
  paymentMode: PaymentMode,
  transactionRef: string | null,
  remarks: string | null,
  additionalFeeRules: AdditionalFeeRule[],
  advocate: Advocate
) => {
  const currentYear = new Date().getFullYear();
  const nextTxId = transactions.length > 0 ? Math.max(...transactions.map((t) => t.id)) + 1 : 1;
  const receiptNo = `HBA-${currentYear}-${nextTxId.toString().padStart(6, '0')}`;

  let lineIdCounter = paymentLines.length > 0 ? Math.max(...paymentLines.map((l) => l.id)) + 1 : 1;
  let dueIdCounter = dues.length > 0 ? Math.max(...dues.map((d) => d.id)) + 1 : 1;

  const newLines: PaymentLine[] = [];
  const localDuesCopy = [...dues];

  // A. Process Checked Outstanding Dues
  dueIds.forEach((dueId) => {
    const dueIndex = localDuesCopy.findIndex((d) => d.id === dueId);
    if (dueIndex !== -1 && localDuesCopy[dueIndex].status === 'UNPAID') {
      localDuesCopy[dueIndex] = {
        ...localDuesCopy[dueIndex],
        status: 'PAID',
        payment_transaction_id: nextTxId,
      };

      // Create line for base subscription
      newLines.push({
        id: lineIdCounter++,
        transaction_id: nextTxId,
        month: localDuesCopy[dueIndex].month,
        year: localDuesCopy[dueIndex].year,
        fee_component: 'SUBSCRIPTION',
        amount: localDuesCopy[dueIndex].base_due_amount,
      });

      // Create line for special fee if applicable
      if (localDuesCopy[dueIndex].special_due_amount > 0) {
        newLines.push({
          id: lineIdCounter++,
          transaction_id: nextTxId,
          month: localDuesCopy[dueIndex].month,
          year: localDuesCopy[dueIndex].year,
          fee_component: 'SPECIAL_FEE',
          amount: localDuesCopy[dueIndex].special_due_amount,
        });
      }
    }
  });

  // B. Process Advance Prepayments
  if (advanceMonthsCount > 0) {
    const advocateDues = localDuesCopy.filter((d) => d.advocate_id === advocateId);
    let latestYear = 2026;
    let latestMonth = 6; // Current June 2026 base

    if (advocateDues.length > 0) {
      advocateDues.forEach((d) => {
        if (d.year > latestYear || (d.year === latestYear && parseInt(d.month) > latestMonth)) {
          latestYear = d.year;
          latestMonth = parseInt(d.month);
        }
      });
    }

    let currentMonthCursor = latestMonth;
    let currentYearCursor = latestYear;

    for (let i = 0; i < advanceMonthsCount; i++) {
      currentMonthCursor++;
      if (currentMonthCursor > 12) {
        currentMonthCursor = 1;
        currentYearCursor++;
      }

      const monthStr = currentMonthCursor.toString().padStart(2, '0');
      const base = settings.monthly_subscription_fee;
      const special = calculateAdditionalDuesForPeriod(additionalFeeRules, currentYearCursor, monthStr, advocate.joined_date);
      const total = base + special;

      const newFutureDueId = dueIdCounter++;
      
      localDuesCopy.push({
        id: newFutureDueId,
        advocate_id: advocateId,
        month: monthStr,
        year: currentYearCursor,
        base_due_amount: base,
        special_due_amount: special,
        total_due_amount: total,
        status: 'PAID',
        payment_transaction_id: nextTxId,
      });

      newLines.push({
        id: lineIdCounter++,
        transaction_id: nextTxId,
        month: monthStr,
        year: currentYearCursor,
        fee_component: 'SUBSCRIPTION',
        amount: base,
      });

      if (special > 0) {
        newLines.push({
          id: lineIdCounter++,
          transaction_id: nextTxId,
          month: monthStr,
          year: currentYearCursor,
          fee_component: 'SPECIAL_FEE',
          amount: special,
        });
      }
    }
  }

  const totalAmount = newLines.reduce((acc, curr) => acc + curr.amount, 0);

  const newTransaction: PaymentTransaction = {
    id: nextTxId,
    receipt_no: receiptNo,
    advocate_id: advocateId,
    collected_by_id: currentUser?.id || 'system',
    total_amount: totalAmount,
    payment_mode: paymentMode,
    payment_date: new Date().toISOString(),
    transaction_ref: transactionRef,
    remarks: remarks || 'Counter Checkout Collection',
  };

  const newLog: ActivityLog = {
    id: activityLogs.length + 1,
    timestamp: new Date().toISOString(),
    advocate_id: advocateId,
    action_type: 'PAYMENT_COLLECTED',
    performed_by_id: currentUser?.id || 'system',
    payload: { receipt_no: receiptNo, total_amount: totalAmount, mode: paymentMode },
  };

  return {
    updatedDues: localDuesCopy,
    newTransaction,
    newLines,
    newLog,
  };
};

/**
 * Pure function to calculate a waived due item state.
 */
export const calculateWaiver = (
  dues: MonthlyDue[],
  activityLogs: ActivityLog[],
  currentUser: User | null,
  dueId: number,
  remarks: string
) => {
  const dueIndex = dues.findIndex((d) => d.id === dueId);
  if (dueIndex === -1) return null;

  const updatedDues = [...dues];
  const due = updatedDues[dueIndex];
  updatedDues[dueIndex] = {
    ...due,
    status: 'WAIVED',
  };

  const newLog: ActivityLog = {
    id: activityLogs.length + 1,
    timestamp: new Date().toISOString(),
    advocate_id: due.advocate_id,
    action_type: 'SETTINGS_CHANGED',
    performed_by_id: currentUser?.id || 'system',
    payload: { action: 'Waived due period', due_id: dueId, remarks: remarks },
  };

  return {
    updatedDues,
    newLog,
  };
};
