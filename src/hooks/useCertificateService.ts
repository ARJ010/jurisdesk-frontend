import { useMockDB } from '@/contexts/MockDBContext';
import { evaluateCertificateEligibility } from '@/services/certificateService';

export const useCertificateService = () => {
  const { advocates, getAdvocateDueBalance } = useMockDB();

  const isAdvocateEligibleForCertificate = (advocateId: string) => {
    const advocate = advocates.find((a) => a.id === advocateId);
    if (!advocate) {
      return { eligible: false, reason: 'Advocate profile record not found.' };
    }

    const outstandingBalance = getAdvocateDueBalance(advocateId);
    return evaluateCertificateEligibility(advocate, outstandingBalance);
  };

  return {
    isAdvocateEligibleForCertificate,
  };
};
