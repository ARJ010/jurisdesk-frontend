import type { User, ActivityLog, TreasuryTransaction } from '@/types';

export const getFinancialYear = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth(); // April is index 3
  if (month >= 3) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

export const calculateTreasuryTransaction = (
  transactions: TreasuryTransaction[],
  activityLogs: ActivityLog[],
  currentUser: User | null,
  txData: Omit<TreasuryTransaction, 'id' | 'financial_year' | 'created_by' | 'created_at'>
) => {
  const nextIdNum = transactions.length > 0
    ? Math.max(...transactions.map(t => parseInt(t.id.replace('tx-', '')) || 0)) + 1
    : 1;
  const nextId = `tx-${nextIdNum}`;
  const derivedFinancialYear = getFinancialYear(txData.transaction_date);
  
  const creatorName = currentUser
    ? `${currentUser.first_name} ${currentUser.last_name}`.trim() || currentUser.username
    : 'system';

  const newTransaction: TreasuryTransaction = {
    ...txData,
    id: nextId,
    financial_year: derivedFinancialYear,
    created_by: creatorName,
    created_at: new Date().toISOString(),
  };

  let message = '';
  if (txData.transaction_mode === 'ADJUSTMENT') {
    message = `Added treasury adjustment: ${txData.adjustment_type} of ₹${txData.amount} on account ${txData.account} (${txData.category})`;
  } else {
    message = `Added treasury transfer: transferred ₹${txData.amount} from ${txData.source_account} to ${txData.destination_account} (${txData.category})`;
  }

  const newLog: ActivityLog = {
    id: activityLogs.length + 1,
    timestamp: new Date().toISOString(),
    advocate_id: null,
    action_type: 'TREASURY_TRANSACTION_CREATED',
    performed_by_id: currentUser?.id || 'system',
    payload: {
      message,
      transaction_id: nextId,
      transaction_mode: txData.transaction_mode,
      amount: txData.amount,
    },
  };

  return {
    newTransaction,
    newLog,
  };
};
