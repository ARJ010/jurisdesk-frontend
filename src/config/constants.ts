export const SCHEMA_VERSION = '4';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const ADVOCATE_STATUSES = ['ACTIVE', 'SUSPENDED', 'RETIRED', 'DECEASED'] as const;

export const PAYMENT_MODES = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'] as const;

export const DEFAULT_ASSOCIATION_SETTINGS = {
  association_name: 'Hosdurg Bar Association',
  address: 'Court Road, Kanhangad, Kasaragod, Kerala - 671315',
  phone: '+91 467 220 1234',
  email: 'treasury@hosdurgbar.org',
  website: 'www.hosdurgbar.org',
  logo_url: null,
  watermark_url: null,
  signatures: [
    { id: 'pres', label: 'President', display_order: 1, enabled: true },
    { id: 'sec', label: 'Secretary', display_order: 2, enabled: true },
    { id: 'treas', label: 'Treasurer', display_order: 3, enabled: true }
  ],
  monthly_subscription_fee: 100.00,
  onam_contribution_fee: 500.00,
  onam_contribution_month: '09', // September
  accounting_start_date: '2024-01-01',
  bank_account_details: {
    bank_name: 'State Bank of India',
    account_no: '12345678901',
    ifsc: 'SBIN0001234',
    upi_id: 'hosdurgbar@sbi',
  },
  primary_theme_color: '#7c3aed',
  card_validity_years: 3,
};
