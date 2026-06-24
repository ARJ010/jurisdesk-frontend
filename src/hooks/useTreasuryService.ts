import { useMockDB } from '@/contexts/MockDBContext';
import { calculateTreasuryTransaction } from '@/services/treasuryService';
import { STORAGE_KEYS } from '@/config/storage';
import type { TreasuryTransaction } from '@/types';

export const useTreasuryService = () => {
  const {
    currentUser,
    treasuryTransactions,
    setTreasuryTransactions,
    activityLogs,
    setActivityLogs,
  } = useMockDB();

  const addTreasuryTransaction = (txData: Omit<TreasuryTransaction, 'id' | 'financial_year' | 'created_by' | 'created_at'>) => {
    const canManageSettings = currentUser?.user_permissions?.includes('manage_settings');
    if (!canManageSettings) {
      throw new Error('Access denied: Insufficient permissions to perform treasury transactions.');
    }

    const result = calculateTreasuryTransaction(
      treasuryTransactions,
      activityLogs,
      currentUser,
      txData
    );

    const newTransactions = [...treasuryTransactions, result.newTransaction];
    const newLogs = [...activityLogs, result.newLog];

    setTreasuryTransactions(newTransactions);
    setActivityLogs(newLogs);

    localStorage.setItem(STORAGE_KEYS.TREASURY_TRANSACTIONS, JSON.stringify(newTransactions));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(newLogs));

    return result.newTransaction;
  };

  return {
    treasuryTransactions,
    addTreasuryTransaction,
    canAddTransactions: currentUser?.user_permissions?.includes('manage_settings') || false,
  };
};
