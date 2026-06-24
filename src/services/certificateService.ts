import type { Advocate } from '@/types';

/**
 * Pure function to evaluate if an advocate is eligible to generate their experience credentials.
 */
export const evaluateCertificateEligibility = (
  advocate: Advocate,
  outstandingBalance: number
): { eligible: boolean; reason: string | null } => {
  // Condition 1: Advocate Status == ACTIVE
  if (advocate.status !== 'ACTIVE') {
    const statusText = advocate.status.charAt(0) + advocate.status.slice(1).toLowerCase();
    return { 
      eligible: false, 
      reason: `Advocate status is currently ${statusText}. Only ACTIVE members are eligible.` 
    };
  }

  // Condition 2: Outstanding Balance == ₹0
  if (outstandingBalance > 0) {
    return { 
      eligible: false, 
      reason: `Outstanding dues of ₹${outstandingBalance.toFixed(2)} must be cleared.` 
    };
  }

  return { eligible: true, reason: null };
};
