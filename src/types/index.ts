export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  groups: ('Advocate' | 'Office Staff' | 'Admin Advocate')[];
  user_permissions: string[];
  additional_permissions?: string[];
}

export type AdvocateStatus = 'ACTIVE' | 'SUSPENDED' | 'DECEASED' | 'RETIRED';

export interface Advocate {
  id: string;
  user_id: string; // Foreign key to User
  mobile_number: string;
  enrolment_no: string;
  kawf_no: string | null;
  date_of_birth: string; // YYYY-MM-DD
  blood_group: string;
  date_of_enrolment: string; // YYYY-MM-DD
  joined_date: string; // YYYY-MM-DD
  address: string;
  picture_url: string | null;
  status: AdvocateStatus;
  internal_notes: string | null;
}

export type MonthlyDueStatus = 'UNPAID' | 'PAID' | 'WAIVED';

export interface MonthlyDue {
  id: number;
  advocate_id: string;
  month: string; // MM
  year: number;
  base_due_amount: number;
  special_due_amount: number;
  total_due_amount: number; // base_due_amount + special_due_amount
  status: MonthlyDueStatus;
  payment_transaction_id: number | null;
}

export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';

export interface PaymentTransaction {
  id: number;
  receipt_no: string; // e.g. HBA-YYYY-000001
  advocate_id: string;
  collected_by_id: string; // User ID of Staff/Admin
  total_amount: number; // Derived dynamically in UI/API
  payment_mode: PaymentMode;
  payment_date: string; // ISO datetime
  transaction_ref: string | null;
  remarks: string | null;
}

export interface PaymentLine {
  id: number;
  transaction_id: number;
  month: string; // MM
  year: number;
  fee_component: 'SUBSCRIPTION' | 'SPECIAL_FEE';
  amount: number;
}

export type ActivityLogType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'USER_CREATED'
  | 'USER_GROUPS_CHANGED'
  | 'MEMBER_REGISTERED'
  | 'PROFILE_UPDATED'
  | 'PROFILE_UPDATED_BY_ADMIN'
  | 'REGISTRY_UPDATED'
  | 'PAYMENT_COLLECTED'
  | 'CERTIFICATE_GENERATED'
  | 'PASSWORD_RESET'
  | 'BULK_IMPORTED'
  | 'SETTINGS_CHANGED'
  | 'TREASURY_TRANSACTION_CREATED'
  | 'PAYMENT_REQUEST_SUBMITTED'
  | 'PAYMENT_REQUEST_APPROVED'
  | 'PAYMENT_REQUEST_REJECTED'
  | 'PAYMENT_REQUEST_CANCELLED';

export interface ActivityLog {
  id: number;
  timestamp: string; // ISO datetime
  advocate_id: string | null;
  action_type: ActivityLogType;
  performed_by_id: string; // User ID
  payload: Record<string, any>;
}

export interface BankAccountDetails {
  bank_name: string;
  account_no: string;
  ifsc: string;
  upi_id: string;
}

export interface AssociationSettings {
  association_name: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string | null;
  monthly_subscription_fee: number;
  onam_contribution_fee: number;
  onam_contribution_month: string; // MM
  accounting_start_date: string; // YYYY-MM-DD
  bank_account_details: BankAccountDetails;
}

export interface OfficePosition {
  id: string;
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

export interface OfficeTerm {
  id: string;
  advocate: string; // Advocate ID
  position: string; // Position ID
  start_date: string; // YYYY-MM-DD
  end_date: string | null; // YYYY-MM-DD or null
  is_current: boolean;
}

export type AdditionalFeeFrequency = 'ONE_TIME' | 'YEARLY' | 'MONTHLY' | 'QUARTERLY' | 'MANUAL';
export type AdditionalFeeAppliesTo = 'NEW_MEMBERS' | 'ALL_ACTIVE_MEMBERS' | 'CUSTOM';

export interface AdditionalFeeRule {
  id: string;
  name: string;
  amount: number;
  frequency: AdditionalFeeFrequency;
  month: string | null; // MM, e.g. '09' for September
  applies_to: AdditionalFeeAppliesTo;
  effective_from: string; // YYYY-MM-DD
  effective_until: string | null; // YYYY-MM-DD or null
  mandatory: boolean;
  active: boolean;
  description: string;
}

export type TreasuryTransactionMode = 'ADJUSTMENT' | 'TRANSFER';
export type TreasuryAccountType = 'CASH' | 'BANK';

export interface TreasuryTransaction {
  id: string;
  transaction_mode: TreasuryTransactionMode;
  transaction_date: string; // YYYY-MM-DD
  financial_year: string; // derived automatically: e.g., '2026-2027'
  account?: TreasuryAccountType; // Required for ADJUSTMENT
  adjustment_type?: 'CREDIT' | 'DEBIT'; // Required for ADJUSTMENT
  source_account?: TreasuryAccountType; // Required for TRANSFER
  destination_account?: TreasuryAccountType; // Required for TRANSFER
  amount: number;
  category: string;
  remarks: string;
  reference_number?: string; // Optional
  created_by: string; // Creator username or name
  created_at: string; // ISO timestamp
}

export type PaymentRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface PaymentRequest {
  id: string;
  advocate_id: string;
  submitted_date: string; // ISO datetime string
  payment_mode: PaymentMode;
  amount: number;
  reference_number: string;
  proof_attachment_url?: string;
  original_file_name?: string;
  mime_type?: string;
  remarks?: string;
  status: PaymentRequestStatus;
  
  // Advocate requested allocation
  requested_due_ids: number[];
  requested_advance_months: number;

  // Admin approved allocation
  approved_due_ids?: number[];
  approved_advance_months?: number;

  // Audit and verification details
  reviewed_by?: string; // User ID
  reviewed_at?: string; // ISO datetime string
  review_notes?: string;
  
  // Linked checkout transaction details (once approved)
  generated_transaction_id?: number; // PaymentTransaction ID
  generated_receipt_number?: string; // HBA-YYYY-00000X receipt number
}
