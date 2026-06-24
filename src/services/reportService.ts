import type { Advocate, MonthlyDue, User, AdditionalFeeRule } from '@/types';

/**
 * Pure function to compile system alerts and operational warnings.
 */
export const compileOperationalNotifications = (
  advocates: Advocate[],
  dues: MonthlyDue[],
  users: User[],
  additionalFeeRules: AdditionalFeeRule[]
) => {
  const alerts: { id: string; type: 'arrears' | 'billing' | 'compliance' | 'reconciliation'; text: string; link?: string }[] = [];

  const activeAdvocates = advocates.filter((a) => a.status === 'ACTIVE');
  
  // 1. Dues older than 12 months (e.g. unpaid dues from 2024 or early 2025)
  activeAdvocates.forEach((adv) => {
    const oldUnpaid = dues.some(
      (d) =>
        d.advocate_id === adv.id &&
        d.status === 'UNPAID' &&
        (d.year < 2025 || (d.year === 2025 && parseInt(d.month) <= 6))
    );
    if (oldUnpaid) {
      const userName = users.find((u) => u.id === adv.user_id)?.first_name || 'Advocate';
      alerts.push({
        id: `arr-${adv.id}`,
        type: 'arrears',
        text: `Arrears Alert: Adv. ${userName} has unpaid dues older than 12 months.`,
        link: `/admin/advocates/${adv.id}?tab=checkout`,
      });
    }
  });

  // 2. Compliance Alert: Missing KAWF numbers
  activeAdvocates.forEach((adv) => {
    if (!adv.kawf_no) {
      const userName = users.find((u) => u.id === adv.user_id)?.first_name || 'Advocate';
      alerts.push({
        id: `kawf-${adv.id}`,
        type: 'compliance',
        text: `Compliance Alert: Adv. ${userName} has no KAWF number registered.`,
        link: `/admin/advocates/${adv.id}?tab=registry`,
      });
    }
  });

  // 3. Billing alert: September special fee parameters missing in settings
  const hasOnamFee = additionalFeeRules.some(f => f.name.toLowerCase().includes('onam') && f.active);
  if (!hasOnamFee) {
    alerts.push({
      id: 'billing-onam',
      type: 'billing',
      text: 'Billing configuration warning: September/Onam Contribution fee is not configured in Additional Fee Rules.',
      link: '/admin/settings?tab=financial',
    });
  }

  // 4. Reconciliation: Daily drawer warning
  alerts.push({
    id: 'recon-warn',
    type: 'reconciliation',
    text: 'Reconciliation reminder: Cash register must be matched with counter receipts at close of business.',
  });

  return alerts;
};
