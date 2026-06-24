import { useMockDB } from '@/contexts/MockDBContext';
import { compileOperationalNotifications } from '@/services/reportService';

export const useReportService = () => {
  const {
    advocates,
    dues,
    users,
    additionalFeeRules,
    getAdvocateReceipts,
    getAdvocateTimeline,
  } = useMockDB();

  const getOperationalNotifications = () => {
    return compileOperationalNotifications(advocates, dues, users, additionalFeeRules);
  };

  return {
    getAdvocateReceipts,
    getAdvocateTimeline,
    getOperationalNotifications,
  };
};
