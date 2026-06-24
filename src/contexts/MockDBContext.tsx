import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  User,
  Advocate,
  MonthlyDue,
  PaymentTransaction,
  PaymentLine,
  ActivityLog,
  AssociationSettings,
  PaymentMode,
  MonthlyDueStatus,
  OfficePosition,
  OfficeTerm,
  AdditionalFeeRule,
  TreasuryTransaction,
  PaymentRequest,
} from '../types';
import { STORAGE_KEYS } from '@/config/storage';
import { SCHEMA_VERSION, DEFAULT_ASSOCIATION_SETTINGS } from '@/config/constants';
import { GROUP_PERMISSIONS } from '@/config/permissions';
import { calculateAdditionalDuesForPeriod } from '../services/paymentService';

interface MockDBContextProps {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  advocates: Advocate[];
  setAdvocates: React.Dispatch<React.SetStateAction<Advocate[]>>;
  dues: MonthlyDue[];
  setDues: React.Dispatch<React.SetStateAction<MonthlyDue[]>>;
  transactions: PaymentTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<PaymentTransaction[]>>;
  paymentLines: PaymentLine[];
  setPaymentLines: React.Dispatch<React.SetStateAction<PaymentLine[]>>;
  activityLogs: ActivityLog[];
  setActivityLogs: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
  settings: AssociationSettings;
  setSettings: React.Dispatch<React.SetStateAction<AssociationSettings>>;
  officePositions: OfficePosition[];
  setOfficePositions: React.Dispatch<React.SetStateAction<OfficePosition[]>>;
  officeTerms: OfficeTerm[];
  setOfficeTerms: React.Dispatch<React.SetStateAction<OfficeTerm[]>>;
  additionalFeeRules: AdditionalFeeRule[];
  setAdditionalFeeRules: React.Dispatch<React.SetStateAction<AdditionalFeeRule[]>>;
  treasuryTransactions: TreasuryTransaction[];
  setTreasuryTransactions: React.Dispatch<React.SetStateAction<TreasuryTransaction[]>>;
  paymentRequests: PaymentRequest[];
  setPaymentRequests: React.Dispatch<React.SetStateAction<PaymentRequest[]>>;

  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  registerAdvocate: (advocateData: Omit<Advocate, 'id' | 'user_id'>, name: string, email: string) => void;
  updateAdvocateProfile: (id: string, updatedFields: Partial<Advocate>, updatedUser: Partial<User>) => void;
  checkoutBasket: (
    advocateId: string,
    dueIds: number[],
    advanceMonthsCount: number,
    paymentMode: PaymentMode,
    transactionRef: string | null,
    remarks: string | null
  ) => PaymentTransaction;
  waiveDue: (dueId: number, remarks: string) => void;
  updateSettings: (newSettings: AssociationSettings) => void;
  getAdvocateDueBalance: (advocateId: string) => number;
  getAdvocateDues: (advocateId: string) => MonthlyDue[];
  getAdvocateReceipts: (advocateId: string) => PaymentTransaction[];
  getAdvocateTimeline: (advocateId: string) => ActivityLog[];
  getOperationalNotifications: () => { id: string; type: 'arrears' | 'billing' | 'compliance' | 'reconciliation'; text: string; link?: string }[];
  isAdvocateEligibleForCertificate: (advocateId: string) => { eligible: boolean; reason: string | null };
  updateUser: (userId: string, updatedFields: Partial<User>) => void;
  resetAllData: () => void;
}

const MockDBContext = createContext<MockDBContextProps | undefined>(undefined);

// Helper to generate UUIDs
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const MockDBProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [dues, setDues] = useState<MonthlyDue[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<AssociationSettings>({} as AssociationSettings);
  const [officePositions, setOfficePositions] = useState<OfficePosition[]>([]);
  const [officeTerms, setOfficeTerms] = useState<OfficeTerm[]>([]);
  const [additionalFeeRules, setAdditionalFeeRules] = useState<AdditionalFeeRule[]>([]);
  const [treasuryTransactions, setTreasuryTransactions] = useState<TreasuryTransaction[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);

  // Load initial data from localStorage or seed
  useEffect(() => {
    initializeDB();
  }, []);

  const initializeDB = (forceReset = false) => {
    // Perform key migration for terminology rename
    const oldFeesData = localStorage.getItem('jd_special_fees');
    if (oldFeesData && !localStorage.getItem('jd_additional_fee_rules')) {
      localStorage.setItem('jd_additional_fee_rules', oldFeesData);
      localStorage.removeItem('jd_special_fees');
    }

    const getStored = (key: string) => localStorage.getItem(key);
    const currentSchemaVersion = SCHEMA_VERSION;
    const storedSchemaVersion = getStored(STORAGE_KEYS.SCHEMA_VERSION);
    const needsMigration = storedSchemaVersion !== currentSchemaVersion;

    if (!forceReset && !needsMigration && getStored(STORAGE_KEYS.INITIALIZED)) {
      setUsers(JSON.parse(getStored(STORAGE_KEYS.USERS) || '[]'));
      setAdvocates(JSON.parse(getStored(STORAGE_KEYS.ADVOCATES) || '[]'));
      setDues(JSON.parse(getStored(STORAGE_KEYS.DUES) || '[]'));
      setTransactions(JSON.parse(getStored(STORAGE_KEYS.TRANSACTIONS) || '[]'));
      setPaymentLines(JSON.parse(getStored(STORAGE_KEYS.PAYMENT_LINES) || '[]'));
      setActivityLogs(JSON.parse(getStored(STORAGE_KEYS.ACTIVITY_LOGS) || '[]'));
      setSettings(JSON.parse(getStored(STORAGE_KEYS.SETTINGS) || '{}'));
      setOfficePositions(JSON.parse(getStored(STORAGE_KEYS.OFFICE_POSITIONS) || '[]'));
      setOfficeTerms(JSON.parse(getStored(STORAGE_KEYS.OFFICE_TERMS) || '[]'));
      setAdditionalFeeRules(JSON.parse(getStored(STORAGE_KEYS.ADDITIONAL_FEE_RULES) || '[]'));
      setTreasuryTransactions(JSON.parse(getStored(STORAGE_KEYS.TREASURY_TRANSACTIONS) || '[]'));
      
      const storedRequests = getStored(STORAGE_KEYS.PAYMENT_REQUESTS);
      if (storedRequests) {
        setPaymentRequests(JSON.parse(storedRequests));
      } else {
        const currentAdvocates = JSON.parse(getStored(STORAGE_KEYS.ADVOCATES) || '[]');
        const currentDues = JSON.parse(getStored(STORAGE_KEYS.DUES) || '[]');
        const currentTransactions = JSON.parse(getStored(STORAGE_KEYS.TRANSACTIONS) || '[]');
        const currentUsers = JSON.parse(getStored(STORAGE_KEYS.USERS) || '[]');
        
        const sandeep = currentAdvocates.find((a: any) => a.enrolment_no === 'K/876/2017');
        const manoj = currentAdvocates.find((a: any) => a.enrolment_no === 'K/1092/2015');
        const staff = currentUsers.find((u: any) => u.username === 'staff');
        
        const demoRequests: PaymentRequest[] = [];
        if (sandeep) {
          demoRequests.push({
            id: 'REQ-000001',
            advocate_id: sandeep.id,
            submitted_date: new Date(Date.now() - 3600000 * 24).toISOString(),
            payment_mode: 'UPI',
            amount: 200,
            reference_number: 'UPI9988776655',
            proof_attachment_url: 'https://example.com/receipt-proof-1.pdf',
            original_file_name: 'receipt-proof-1.pdf',
            mime_type: 'application/pdf',
            remarks: 'Paid via GPay last evening.',
            status: 'PENDING',
            requested_due_ids: currentDues
              .filter((d: any) => d.advocate_id === sandeep.id && d.status === 'UNPAID')
              .slice(0, 2)
              .map((d: any) => d.id),
            requested_advance_months: 0,
          });
          
          const sTx = currentTransactions.find((t: any) => t.advocate_id === sandeep.id);
          demoRequests.push({
            id: 'REQ-000002',
            advocate_id: sandeep.id,
            submitted_date: new Date(Date.now() - 3600000 * 48).toISOString(),
            payment_mode: 'BANK_TRANSFER',
            amount: 300,
            reference_number: 'TXN8877665544',
            proof_attachment_url: 'https://example.com/screenshot.jpg',
            original_file_name: 'screenshot.jpg',
            mime_type: 'image/jpeg',
            remarks: 'IMPS transfer from State Bank of India.',
            status: 'APPROVED',
            requested_due_ids: [],
            requested_advance_months: 3,
            approved_due_ids: [],
            approved_advance_months: 3,
            reviewed_by: staff?.id || 'staff-id',
            reviewed_at: new Date(Date.now() - 3600000 * 40).toISOString(),
            review_notes: 'Verified transfer from SBI statements.',
            generated_transaction_id: sTx?.id || 1,
            generated_receipt_number: sTx?.receipt_no || 'HBA-2026-000001',
          });
        }
        
        if (manoj) {
          demoRequests.push({
            id: 'REQ-000003',
            advocate_id: manoj.id,
            submitted_date: new Date(Date.now() - 3600000 * 72).toISOString(),
            payment_mode: 'CHEQUE',
            amount: 500,
            reference_number: 'CHQ123456',
            proof_attachment_url: 'https://example.com/cheque-copy.png',
            original_file_name: 'cheque-copy.png',
            mime_type: 'image/png',
            remarks: 'Cheque dropped in dropbox.',
            status: 'REJECTED',
            requested_due_ids: currentDues
              .filter((d: any) => d.advocate_id === manoj.id && d.status === 'UNPAID')
              .slice(0, 1)
              .map((d: any) => d.id),
            requested_advance_months: 0,
            reviewed_by: staff?.id || 'staff-id',
            reviewed_at: new Date(Date.now() - 3600000 * 60).toISOString(),
            review_notes: 'Cheque bounced. Contact bank for details.',
          });
        }
        
        setPaymentRequests(demoRequests);
        localStorage.setItem(STORAGE_KEYS.PAYMENT_REQUESTS, JSON.stringify(demoRequests));
      }
      
      const sessionUser = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER_SESSION);
      if (sessionUser) {
        setCurrentUser(JSON.parse(sessionUser));
      }
      return;
    }

    // --- SEEDING INITIAL DATA ---
    const seedSettings: AssociationSettings = DEFAULT_ASSOCIATION_SETTINGS;

    // User Seeds
    const adminUser: User = {
      id: generateUUID(),
      username: 'admin',
      email: 'haridasan@example.com',
      first_name: 'Haridasan',
      last_name: 'Nair',
      is_active: true,
      groups: ['Advocate', 'Admin Advocate'],
      user_permissions: [
        'view_personal_profile',
        'view_personal_payments',
        'download_certificate',
        'view_operational_dashboard',
        'manage_advocates',
        'collect_payments',
        'view_reports',
        'manage_settings',
      ],
      additional_permissions: [],
    };

    const staffUser: User = {
      id: generateUUID(),
      username: 'staff',
      email: 'bindu@example.com',
      first_name: 'Bindu',
      last_name: 'Rajesh',
      is_active: true,
      groups: ['Office Staff'],
      user_permissions: ['view_operational_dashboard', 'manage_advocates', 'collect_payments', 'view_reports', 'view_personal_profile'],
      additional_permissions: [],
    };

    const adv1User: User = {
      id: generateUUID(),
      username: 'K/876/2017',
      email: 'sandeep.kv@example.com',
      first_name: 'Sandeep',
      last_name: 'K. V.',
      is_active: true,
      groups: ['Advocate'],
      user_permissions: ['view_personal_profile', 'view_personal_payments', 'download_certificate'],
      additional_permissions: [],
    };

    const adv2User: User = {
      id: generateUUID(),
      username: 'K/432/2020',
      email: 'deepa.nair@example.com',
      first_name: 'Deepa',
      last_name: 'Nair',
      is_active: true,
      groups: ['Advocate'],
      user_permissions: ['view_personal_profile', 'view_personal_payments', 'download_certificate'],
      additional_permissions: [],
    };

    const adv3User: User = {
      id: generateUUID(),
      username: 'K/1092/2015',
      email: 'manoj.kumar@example.com',
      first_name: 'Manoj',
      last_name: 'Kumar',
      is_active: true,
      groups: ['Advocate'],
      user_permissions: ['view_personal_profile', 'view_personal_payments', 'download_certificate'],
      additional_permissions: [],
    };

    const seedUsers = [adminUser, staffUser, adv1User, adv2User, adv3User];

    // Advocate Seeds
    const advAdmin: Advocate = {
      id: generateUUID(),
      user_id: adminUser.id,
      mobile_number: '9845012345',
      enrolment_no: 'K/101/2010',
      kawf_no: 'KAWF-5543',
      date_of_birth: '1975-04-12',
      blood_group: 'B+',
      date_of_enrolment: '2010-02-18',
      joined_date: '2024-01-01',
      address: 'Nair Court, Hosdurg, Kanhangad, Kasaragod, Kerala',
      picture_url: null,
      status: 'ACTIVE',
      internal_notes: 'Founding member. Active in all committee decisions.',
    };

    const adv1: Advocate = {
      id: generateUUID(),
      user_id: adv1User.id,
      mobile_number: '9876543210',
      enrolment_no: 'K/876/2017',
      kawf_no: 'KAWF-9844',
      date_of_birth: '1990-05-14',
      blood_group: 'A+',
      date_of_enrolment: '2017-03-20',
      joined_date: '2024-01-15',
      address: 'K.V. House, Nileshwar, Kasaragod, Kerala',
      picture_url: null,
      status: 'ACTIVE',
      internal_notes: 'Regular attendee at monthly general body meetings.',
    };

    const adv2: Advocate = {
      id: generateUUID(),
      user_id: adv2User.id,
      mobile_number: '9876543211',
      enrolment_no: 'K/432/2020',
      kawf_no: 'KAWF-10432',
      date_of_birth: '1995-10-22',
      blood_group: 'O-',
      date_of_enrolment: '2020-11-05',
      joined_date: '2025-05-10',
      address: 'Vrindavan, Kanhangad, Kasaragod, Kerala',
      picture_url: null,
      status: 'ACTIVE',
      internal_notes: null,
    };

    const adv3: Advocate = {
      id: generateUUID(),
      user_id: adv3User.id,
      mobile_number: '9876543212',
      enrolment_no: 'K/1092/2015',
      kawf_no: null, // Seed missing KAWF number!
      date_of_birth: '1987-12-01',
      blood_group: 'AB+',
      date_of_enrolment: '2015-09-12',
      joined_date: '2024-01-10',
      address: 'Manoj Bhavan, Cheruvathur, Kasaragod, Kerala',
      picture_url: null,
      status: 'ACTIVE',
      internal_notes: 'Urgent compliance warning: no KAWF number registered.',
    };

    const seedAdvocates = [advAdmin, adv1, adv2, adv3];

    const seedPositions: OfficePosition[] = [
      { id: 'pos-1', name: 'President', description: 'President of the Association', display_order: 1, is_active: true },
      { id: 'pos-2', name: 'Vice President', description: 'Vice President of the Association', display_order: 2, is_active: true },
      { id: 'pos-3', name: 'Secretary', description: 'Secretary of the Association', display_order: 3, is_active: true },
      { id: 'pos-4', name: 'Treasurer', description: 'Treasurer of the Association', display_order: 4, is_active: true },
      { id: 'pos-5', name: 'Executive Committee Member', description: 'Member of the Executive Committee', display_order: 5, is_active: true },
      { id: 'pos-6', name: 'Library Committee Member', description: 'Member of the Library Committee', display_order: 6, is_active: true },
    ];

    const seedSpecialFees: AdditionalFeeRule[] = [
      {
        id: 'fee-1',
        name: 'Onam Contribution',
        amount: 500,
        frequency: 'YEARLY',
        month: '09',
        applies_to: 'ALL_ACTIVE_MEMBERS',
        effective_from: '2024-01-01',
        effective_until: null,
        mandatory: true,
        active: true,
        description: 'Annual Onam festival contribution fee'
      },
      {
        id: 'fee-2',
        name: 'Building Fund',
        amount: 1000,
        frequency: 'ONE_TIME',
        month: null,
        applies_to: 'NEW_MEMBERS',
        effective_from: '2026-01-01',
        effective_until: null,
        mandatory: true,
        active: true,
        description: 'One-time building fund contribution for new members'
      },
      {
        id: 'fee-3',
        name: 'Flood Relief Fund',
        amount: 250,
        frequency: 'MANUAL',
        month: null,
        applies_to: 'CUSTOM',
        effective_from: '2024-01-01',
        effective_until: null,
        mandatory: false,
        active: true,
        description: 'Flood relief fund support'
      }
    ];

    const seedTerms: OfficeTerm[] = [
      {
        id: 'term-1',
        advocate: advAdmin.id, // Haridasan Nair
        position: 'pos-4', // Treasurer
        start_date: '2025-01-01',
        end_date: null,
        is_current: true
      },
      {
        id: 'term-2',
        advocate: advAdmin.id, // Haridasan Nair
        position: 'pos-5', // Executive Committee Member
        start_date: '2024-01-01',
        end_date: null,
        is_current: true
      },
      {
        id: 'term-3',
        advocate: advAdmin.id, // Haridasan Nair
        position: 'pos-4', // Treasurer
        start_date: '2022-01-01',
        end_date: '2024-12-31',
        is_current: false
      }
    ];

    // Dues, Transactions, and Lines Generators
    const seedDues: MonthlyDue[] = [];
    const seedTransactions: PaymentTransaction[] = [];
    const seedLines: PaymentLine[] = [];
    let dueCounter = 1;
    let transactionCounter = 1;
    let lineCounter = 1;

    // Current Date for seed calculation (fixed at June 2026)
    const currentYear = 2026;
    const currentMonth = 6;

    // Helper to generate dues for advocate since joined_date to current date
    const generateDuesForAdvocate = (adv: Advocate, paymentStatusMap: Record<string, MonthlyDueStatus>) => {
      const joinDate = new Date(adv.joined_date);
      const startYear = joinDate.getFullYear();
      const startMonth = joinDate.getMonth() + 1;

      for (let y = startYear; y <= currentYear; y++) {
        const mStart = y === startYear ? startMonth : 1;
        const mEnd = y === currentYear ? currentMonth : 12;

        for (let m = mStart; m <= mEnd; m++) {
          const monthStr = m.toString().padStart(2, '0');
          const key = `${y}-${monthStr}`;
          
          const status = paymentStatusMap[key] || 'UNPAID';
          const isSept = monthStr === seedSettings.onam_contribution_month;
          
          const base = seedSettings.monthly_subscription_fee;
          const special = isSept ? seedSettings.onam_contribution_fee : 0;
          const total = base + special;

          seedDues.push({
            id: dueCounter++,
            advocate_id: adv.id,
            month: monthStr,
            year: y,
            base_due_amount: base,
            special_due_amount: special,
            total_due_amount: total,
            status: status,
            payment_transaction_id: null,
          });
        }
      }
    };

    // Adv Admin: Haridasan Nair (Joined Jan 2024)
    // Seed: All PAID up to date
    const advAdminStatusMap: Record<string, MonthlyDueStatus> = {};
    for (let m = 1; m <= 12; m++) advAdminStatusMap[`2024-${m.toString().padStart(2, '0')}`] = 'PAID';
    for (let m = 1; m <= 12; m++) advAdminStatusMap[`2025-${m.toString().padStart(2, '0')}`] = 'PAID';
    for (let m = 1; m <= 6; m++) advAdminStatusMap[`2026-${m.toString().padStart(2, '0')}`] = 'PAID';
    generateDuesForAdvocate(advAdmin, advAdminStatusMap);

    // Adv 1: Sandeep KV (Joined Jan 2024)
    // Seed: 2024 completely PAID, 2025 partially PAID (Jan-Aug paid, Sept waived, Oct-Dec UNPAID), 2026 UNPAID
    const adv1StatusMap: Record<string, MonthlyDueStatus> = {};
    for (let m = 1; m <= 12; m++) adv1StatusMap[`2024-${m.toString().padStart(2, '0')}`] = 'PAID';
    for (let m = 1; m <= 8; m++) adv1StatusMap[`2025-${m.toString().padStart(2, '0')}`] = 'PAID';
    adv1StatusMap['2025-09'] = 'WAIVED'; // Sept waived
    adv1StatusMap['2025-10'] = 'UNPAID';
    adv1StatusMap['2025-11'] = 'UNPAID';
    adv1StatusMap['2025-12'] = 'UNPAID';
    for (let m = 1; m <= 6; m++) adv1StatusMap[`2026-${m.toString().padStart(2, '0')}`] = 'UNPAID';

    generateDuesForAdvocate(adv1, adv1StatusMap);

    // Adv 2: Deepa Nair (Joined May 2025)
    // Seed: All PAID up to date
    const adv2StatusMap: Record<string, MonthlyDueStatus> = {};
    for (let m = 5; m <= 12; m++) adv2StatusMap[`2025-${m.toString().padStart(2, '0')}`] = 'PAID';
    for (let m = 1; m <= 6; m++) adv2StatusMap[`2026-${m.toString().padStart(2, '0')}`] = 'PAID';

    generateDuesForAdvocate(adv2, adv2StatusMap);

    // Adv 3: Manoj Kumar (Joined Jan 2024)
    // Seed: Jan-June 2024 PAID. Unpaid ever since July 2024 (Very high arrears!)
    const adv3StatusMap: Record<string, MonthlyDueStatus> = {};
    for (let m = 1; m <= 6; m++) adv3StatusMap[`2024-${m.toString().padStart(2, '0')}`] = 'PAID';
    generateDuesForAdvocate(adv3, adv3StatusMap);

    // Generate Transaction and Line records for PAID seeds
    // To keep it simple, we group paid dues into transactions
    const createPaidTransaction = (adv: Advocate, year: number, months: string[], paymentMode: PaymentMode) => {
      const txId = transactionCounter++;
      const yearShort = year.toString();
      const seq = txId.toString().padStart(6, '0');
      const receiptNo = `HBA-${yearShort}-${seq}`;

      let total = 0;
      months.forEach((mStr) => {
        const matchingDue = seedDues.find((d) => d.advocate_id === adv.id && d.year === year && d.month === mStr);
        if (matchingDue) {
          matchingDue.payment_transaction_id = txId;
          
          // Line 1: Subscription
          seedLines.push({
            id: lineCounter++,
            transaction_id: txId,
            month: mStr,
            year: year,
            fee_component: 'SUBSCRIPTION',
            amount: matchingDue.base_due_amount,
          });
          total += matchingDue.base_due_amount;

          // Line 2: Special Fee (if September)
          if (matchingDue.special_due_amount > 0) {
            seedLines.push({
              id: lineCounter++,
              transaction_id: txId,
              month: mStr,
              year: year,
              fee_component: 'SPECIAL_FEE',
              amount: matchingDue.special_due_amount,
            });
            total += matchingDue.special_due_amount;
          }
        }
      });

      seedTransactions.push({
        id: txId,
        receipt_no: receiptNo,
        advocate_id: adv.id,
        collected_by_id: staffUser.id,
        total_amount: total,
        payment_mode: paymentMode,
        payment_date: new Date(year, parseInt(months[months.length - 1]) - 1, 28, 11, 30).toISOString(),
        transaction_ref: paymentMode === 'UPI' ? 'UPI' + Math.floor(Math.random() * 9000000000) : null,
        remarks: 'System Seed Collection',
      });
    };

    // Create transactions for Haridasan (Admin)
    createPaidTransaction(advAdmin, 2024, ['01', '02', '03', '04', '05', '06'], 'BANK_TRANSFER');
    createPaidTransaction(advAdmin, 2024, ['07', '08', '09', '10', '11', '12'], 'BANK_TRANSFER');
    createPaidTransaction(advAdmin, 2025, ['01', '02', '03', '04', '05', '06'], 'UPI');
    createPaidTransaction(advAdmin, 2025, ['07', '08', '09', '10', '11', '12'], 'UPI');
    createPaidTransaction(advAdmin, 2026, ['01', '02', '03', '04', '05', '06'], 'CASH');

    // Create transactions for Sandeep
    createPaidTransaction(adv1, 2024, ['01', '02', '03', '04', '05', '06'], 'CASH');
    createPaidTransaction(adv1, 2024, ['07', '08', '09', '10', '11', '12'], 'UPI');
    createPaidTransaction(adv1, 2025, ['01', '02', '03', '04', '05', '06', '07', '08'], 'CASH');

    // Create transactions for Deepa
    createPaidTransaction(adv2, 2025, ['05', '06', '07', '08', '09', '10', '11', '12'], 'UPI');
    createPaidTransaction(adv2, 2026, ['01', '02', '03', '04', '05', '06'], 'CASH');

    // Create transactions for Manoj
    createPaidTransaction(adv3, 2024, ['01', '02', '03', '04', '05', '06'], 'CASH');

    // Create a dynamic transaction for Sandeep K. V. representing a payment TODAY
    const todayTxId = transactionCounter++;
    const todayReceiptNo = `HBA-2026-${todayTxId.toString().padStart(6, '0')}`;
    const dueToPayToday = seedDues.find(d => d.advocate_id === adv1.id && d.year === 2025 && d.month === '10');
    if (dueToPayToday) {
      dueToPayToday.status = 'PAID';
      dueToPayToday.payment_transaction_id = todayTxId;

      seedLines.push({
        id: lineCounter++,
        transaction_id: todayTxId,
        month: '10',
        year: 2025,
        fee_component: 'SUBSCRIPTION',
        amount: dueToPayToday.base_due_amount,
      });

      seedTransactions.push({
        id: todayTxId,
        receipt_no: todayReceiptNo,
        advocate_id: adv1.id,
        collected_by_id: staffUser.id,
        total_amount: dueToPayToday.base_due_amount,
        payment_mode: 'UPI',
        payment_date: new Date().toISOString(),
        transaction_ref: 'UPI' + Math.floor(Math.random() * 9000000000),
        remarks: 'Live Seed Transaction Today',
      });
    }

    // Seed Activity Logs
    const seedLogs: ActivityLog[] = [
      {
        id: 1,
        timestamp: '2024-01-01T09:00:00Z',
        advocate_id: null,
        action_type: 'SETTINGS_CHANGED',
        performed_by_id: adminUser.id,
        payload: { message: 'Association settings initialized' },
      },
      {
        id: 2,
        timestamp: '2024-01-10T11:00:00Z',
        advocate_id: adv3.id,
        action_type: 'USER_CREATED',
        performed_by_id: adminUser.id,
        payload: { username: adv3.enrolment_no },
      },
      {
        id: 3,
        timestamp: '2024-01-10T11:15:00Z',
        advocate_id: adv3.id,
        action_type: 'MEMBER_REGISTERED',
        performed_by_id: adminUser.id,
        payload: { enrolment_no: adv3.enrolment_no },
      },
      {
        id: 4,
        timestamp: '2024-01-15T10:00:00Z',
        advocate_id: adv1.id,
        action_type: 'MEMBER_REGISTERED',
        performed_by_id: staffUser.id,
        payload: { enrolment_no: adv1.enrolment_no },
      },
      {
        id: 5,
        timestamp: '2025-05-10T14:30:00Z',
        advocate_id: adv2.id,
        action_type: 'MEMBER_REGISTERED',
        performed_by_id: staffUser.id,
        payload: { enrolment_no: adv2.enrolment_no },
      },
    ];

    const seedTreasuryTransactions: TreasuryTransaction[] = [
      {
        id: 'tx-1',
        transaction_mode: 'ADJUSTMENT',
        transaction_date: '2026-06-01',
        financial_year: '2026-2027',
        account: 'CASH',
        adjustment_type: 'CREDIT',
        amount: 10000,
        category: 'Opening balance correction',
        remarks: 'Initial cash drawer opening balance verification',
        reference_number: 'OB-CASH-2026',
        created_by: 'admin',
        created_at: '2026-06-01T09:00:00Z',
      },
      {
        id: 'tx-2',
        transaction_mode: 'ADJUSTMENT',
        transaction_date: '2026-06-01',
        financial_year: '2026-2027',
        account: 'BANK',
        adjustment_type: 'CREDIT',
        amount: 50000,
        category: 'Opening balance correction',
        remarks: 'Initial bank account opening balance verification',
        reference_number: 'OB-BANK-2026',
        created_by: 'admin',
        created_at: '2026-06-01T09:05:00Z',
      }
    ];

    // Set state
    setUsers(seedUsers);
    setAdvocates(seedAdvocates);
    setDues(seedDues);
    setTransactions(seedTransactions);
    setPaymentLines(seedLines);
    setActivityLogs(seedLogs);
    setSettings(seedSettings);
    setOfficePositions(seedPositions);
    setOfficeTerms(seedTerms);
    setAdditionalFeeRules(seedSpecialFees);
    setTreasuryTransactions(seedTreasuryTransactions);

    // Seeding payment requests for fresh seed flow
    const seedRequests = [];
    if (adv1) {
      seedRequests.push({
        id: 'REQ-000001',
        advocate_id: adv1.id,
        submitted_date: new Date(Date.now() - 3600000 * 24).toISOString(),
        payment_mode: 'UPI' as PaymentMode,
        amount: 200,
        reference_number: 'UPI9988776655',
        proof_attachment_url: 'https://example.com/receipt-proof-1.pdf',
        original_file_name: 'receipt-proof-1.pdf',
        mime_type: 'application/pdf',
        remarks: 'Paid via GPay last evening.',
        status: 'PENDING' as const,
        requested_due_ids: seedDues
          .filter((d: any) => d.advocate_id === adv1.id && d.status === 'UNPAID')
          .slice(0, 2)
          .map((d: any) => d.id),
        requested_advance_months: 0,
      });
      
      const sTx = seedTransactions.find((t: any) => t.advocate_id === adv1.id);
      seedRequests.push({
        id: 'REQ-000002',
        advocate_id: adv1.id,
        submitted_date: new Date(Date.now() - 3600000 * 48).toISOString(),
        payment_mode: 'BANK_TRANSFER' as PaymentMode,
        amount: 300,
        reference_number: 'TXN8877665544',
        proof_attachment_url: 'https://example.com/screenshot.jpg',
        original_file_name: 'screenshot.jpg',
        mime_type: 'image/jpeg',
        remarks: 'IMPS transfer from State Bank of India.',
        status: 'APPROVED' as const,
        requested_due_ids: [],
        requested_advance_months: 3,
        approved_due_ids: [],
        approved_advance_months: 3,
        reviewed_by: staffUser.id,
        reviewed_at: new Date(Date.now() - 3600000 * 40).toISOString(),
        review_notes: 'Verified transfer from SBI statements.',
        generated_transaction_id: sTx?.id || 1,
        generated_receipt_number: sTx?.receipt_no || 'HBA-2026-000001',
      });
    }
    
    if (adv3) {
      seedRequests.push({
        id: 'REQ-000003',
        advocate_id: adv3.id,
        submitted_date: new Date(Date.now() - 3600000 * 72).toISOString(),
        payment_mode: 'CHEQUE' as PaymentMode,
        amount: 500,
        reference_number: 'CHQ123456',
        proof_attachment_url: 'https://example.com/cheque-copy.png',
        original_file_name: 'cheque-copy.png',
        mime_type: 'image/png',
        remarks: 'Cheque dropped in dropbox.',
        status: 'REJECTED' as const,
        requested_due_ids: seedDues
          .filter((d: any) => d.advocate_id === adv3.id && d.status === 'UNPAID')
          .slice(0, 1)
          .map((d: any) => d.id),
        requested_advance_months: 0,
        reviewed_by: staffUser.id,
        reviewed_at: new Date(Date.now() - 3600000 * 60).toISOString(),
        review_notes: 'Cheque bounced. Contact bank for details.',
      });
    }
    
    setPaymentRequests(seedRequests);

    // Save to LocalStorage
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, currentSchemaVersion);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seedUsers));
    localStorage.setItem(STORAGE_KEYS.ADVOCATES, JSON.stringify(seedAdvocates));
    localStorage.setItem(STORAGE_KEYS.DUES, JSON.stringify(seedDues));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(seedTransactions));
    localStorage.setItem(STORAGE_KEYS.PAYMENT_LINES, JSON.stringify(seedLines));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(seedLogs));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(seedSettings));
    localStorage.setItem(STORAGE_KEYS.OFFICE_POSITIONS, JSON.stringify(seedPositions));
    localStorage.setItem(STORAGE_KEYS.OFFICE_TERMS, JSON.stringify(seedTerms));
    localStorage.setItem(STORAGE_KEYS.ADDITIONAL_FEE_RULES, JSON.stringify(seedSpecialFees));
    localStorage.setItem(STORAGE_KEYS.TREASURY_TRANSACTIONS, JSON.stringify(seedTreasuryTransactions));
    localStorage.setItem(STORAGE_KEYS.PAYMENT_REQUESTS, JSON.stringify(seedRequests));
  };

  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // --- ACTIONS ---

  const login = async (username: string, password: string): Promise<User | null> => {
    // Simulated delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Simplistic auth mock: username matches, password is "pass@123"
    const user = users.find((u) => u.username === username);
    if (user && password === 'pass@123') {
      setCurrentUser(user);
      sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER_SESSION, JSON.stringify(user));
      
      // Log login activity
      const logId = activityLogs.length + 1;
      const adv = advocates.find((a) => a.user_id === user.id);
      const newLog: ActivityLog = {
        id: logId,
        timestamp: new Date().toISOString(),
        advocate_id: adv ? adv.id : null,
        action_type: 'LOGIN',
        performed_by_id: user.id,
        payload: { username: user.username },
      };
      
      const updatedLogs = [...activityLogs, newLog];
      setActivityLogs(updatedLogs);
      saveToStorage(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);

      return user;
    }
    return null;
  };

  const logout = () => {
    if (currentUser) {
      const logId = activityLogs.length + 1;
      const adv = advocates.find((a) => a.user_id === currentUser.id);
      const newLog: ActivityLog = {
        id: logId,
        timestamp: new Date().toISOString(),
        advocate_id: adv ? adv.id : null,
        action_type: 'LOGOUT',
        performed_by_id: currentUser.id,
        payload: { username: currentUser.username },
      };
      const updatedLogs = [...activityLogs, newLog];
      setActivityLogs(updatedLogs);
      saveToStorage(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
    }
    setCurrentUser(null);
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER_SESSION);
  };

  const registerAdvocate = (advocateData: Omit<Advocate, 'id' | 'user_id'>, name: string, email: string) => {
    const newUserId = generateUUID();
    const newAdvocateId = generateUUID();

    // 1. Create User
    const splitName = name.trim().split(' ');
    const first = splitName[0] || 'Advocate';
    const last = splitName.slice(1).join(' ');

    const newUser: User = {
      id: newUserId,
      username: advocateData.enrolment_no, // Use enrolment number as username
      email: email || `${first.toLowerCase()}@example.com`,
      first_name: first,
      last_name: last,
      is_active: true,
      groups: ['Advocate'],
      user_permissions: ['view_personal_profile', 'view_personal_payments', 'download_certificate'],
      additional_permissions: [],
    };

    // 2. Create Advocate
    const newAdvocate: Advocate = {
      ...advocateData,
      id: newAdvocateId,
      user_id: newUserId,
      picture_url: null,
      status: 'ACTIVE',
    };

    // 3. Generate Dues from Joined Date up to Current month (June 2026)
    const newDues: MonthlyDue[] = [];
    const joinDate = new Date(advocateData.joined_date);
    const startYear = joinDate.getFullYear();
    const startMonth = joinDate.getMonth() + 1;

    // Use current fixed date June 2026
    const currentYear = 2026;
    const currentMonth = 6;

    let dueIdCounter = dues.length > 0 ? Math.max(...dues.map((d) => d.id)) + 1 : 1;

    for (let y = startYear; y <= currentYear; y++) {
      const mStart = y === startYear ? startMonth : 1;
      const mEnd = y === currentYear ? currentMonth : 12;

      for (let m = mStart; m <= mEnd; m++) {
        const monthStr = m.toString().padStart(2, '0');
        const base = settings.monthly_subscription_fee;
        const special = calculateAdditionalDuesForPeriod(additionalFeeRules, y, monthStr, advocateData.joined_date);
        const total = base + special;

        newDues.push({
          id: dueIdCounter++,
          advocate_id: newAdvocateId,
          month: monthStr,
          year: y,
          base_due_amount: base,
          special_due_amount: special,
          total_due_amount: total,
          status: 'UNPAID',
          payment_transaction_id: null,
        });
      }
    }

    // 4. Create Activity Logs
    const logCounter = activityLogs.length + 1;
    const userLog: ActivityLog = {
      id: logCounter,
      timestamp: new Date().toISOString(),
      advocate_id: newAdvocateId,
      action_type: 'USER_CREATED',
      performed_by_id: currentUser?.id || 'system',
      payload: { username: newUser.username },
    };

    const memberLog: ActivityLog = {
      id: logCounter + 1,
      timestamp: new Date().toISOString(),
      advocate_id: newAdvocateId,
      action_type: 'MEMBER_REGISTERED',
      performed_by_id: currentUser?.id || 'system',
      payload: { enrolment_no: newAdvocate.enrolment_no },
    };

    // Update States
    const updatedUsers = [...users, newUser];
    const updatedAdvocates = [...advocates, newAdvocate];
    const updatedDues = [...dues, ...newDues];
    const updatedLogs = [...activityLogs, userLog, memberLog];

    setUsers(updatedUsers);
    setAdvocates(updatedAdvocates);
    setDues(updatedDues);
    setActivityLogs(updatedLogs);

    // Save to LocalStorage
    saveToStorage(STORAGE_KEYS.USERS, updatedUsers);
    saveToStorage(STORAGE_KEYS.ADVOCATES, updatedAdvocates);
    saveToStorage(STORAGE_KEYS.DUES, updatedDues);
    saveToStorage(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
  };

  const updateAdvocateProfile = (id: string, updatedFields: Partial<Advocate>, updatedUser: Partial<User>) => {
    const advocateIndex = advocates.findIndex((a) => a.id === id);
    if (advocateIndex === -1) return;

    const advocate = advocates[advocateIndex];
    const userIndex = users.findIndex((u) => u.id === advocate.user_id);

    const newAdvocates = [...advocates];
    newAdvocates[advocateIndex] = { ...advocate, ...updatedFields };

    let newUsers = [...users];
    if (userIndex !== -1) {
      newUsers[userIndex] = { ...users[userIndex], ...updatedUser };
    }

    // Timeline Log
    const newLog: ActivityLog = {
      id: activityLogs.length + 1,
      timestamp: new Date().toISOString(),
      advocate_id: id,
      action_type: 'PROFILE_UPDATED',
      performed_by_id: currentUser?.id || 'system',
      payload: { changed: Object.keys(updatedFields).concat(Object.keys(updatedUser)) },
    };

    const newLogs = [...activityLogs, newLog];

    setAdvocates(newAdvocates);
    setUsers(newUsers);
    setActivityLogs(newLogs);

    saveToStorage(STORAGE_KEYS.ADVOCATES, newAdvocates);
    saveToStorage(STORAGE_KEYS.USERS, newUsers);
    saveToStorage(STORAGE_KEYS.ACTIVITY_LOGS, newLogs);
  };

  const checkoutBasket = (
    advocateId: string,
    dueIds: number[],
    advanceMonthsCount: number,
    paymentMode: PaymentMode,
    transactionRef: string | null,
    remarks: string | null
  ): PaymentTransaction => {
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
      // Find the last generated billing month-year in system for this advocate
      const advocateDues = localDuesCopy.filter((d) => d.advocate_id === advocateId);
      let latestYear = 2026;
      let latestMonth = 6; // Current June 2026 base

      if (advocateDues.length > 0) {
        // Find max year and month in their billing list
        advocateDues.forEach((d) => {
          if (d.year > latestYear || (d.year === latestYear && parseInt(d.month) > latestMonth)) {
            latestYear = d.year;
            latestMonth = parseInt(d.month);
          }
        });
      }

      // Generate future advance dues and immediately set as PAID
      let currentMonthCursor = latestMonth;
      let currentYearCursor = latestYear;
      const advocateObj = advocates.find((a) => a.id === advocateId);
      const joinedDateStr = advocateObj ? advocateObj.joined_date : '2024-01-01';

      for (let i = 0; i < advanceMonthsCount; i++) {
        currentMonthCursor++;
        if (currentMonthCursor > 12) {
          currentMonthCursor = 1;
          currentYearCursor++;
        }

        const monthStr = currentMonthCursor.toString().padStart(2, '0');
        const base = settings.monthly_subscription_fee;
        const special = calculateAdditionalDuesForPeriod(additionalFeeRules, currentYearCursor, monthStr, joinedDateStr);
        const total = base + special;

        const newFutureDueId = dueIdCounter++;
        
        // Add a pre-paid future due row
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

        // Add payment line item
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

    // C. Calculate derived total
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
      remarks: remarks || 'Unified Counter checkout',
    };

    // D. Audits Log
    const newLog: ActivityLog = {
      id: activityLogs.length + 1,
      timestamp: new Date().toISOString(),
      advocate_id: advocateId,
      action_type: 'PAYMENT_COLLECTED',
      performed_by_id: currentUser?.id || 'system',
      payload: { receipt_no: receiptNo, total_amount: totalAmount, mode: paymentMode },
    };

    const newTransactions = [...transactions, newTransaction];
    const newPaymentLines = [...paymentLines, ...newLines];
    const newLogs = [...activityLogs, newLog];

    // Set States
    setDues(localDuesCopy);
    setTransactions(newTransactions);
    setPaymentLines(newPaymentLines);
    setActivityLogs(newLogs);

    // Save Storage
    saveToStorage(STORAGE_KEYS.DUES, localDuesCopy);
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, newTransactions);
    saveToStorage(STORAGE_KEYS.PAYMENT_LINES, newPaymentLines);
    saveToStorage(STORAGE_KEYS.ACTIVITY_LOGS, newLogs);

    return newTransaction;
  };

  const waiveDue = (dueId: number, remarks: string) => {
    const dueIndex = dues.findIndex((d) => d.id === dueId);
    if (dueIndex === -1) return;

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
    const newLogs = [...activityLogs, newLog];

    setDues(updatedDues);
    setActivityLogs(newLogs);

    saveToStorage(STORAGE_KEYS.DUES, updatedDues);
    saveToStorage(STORAGE_KEYS.ACTIVITY_LOGS, newLogs);
  };

  const updateSettings = (newSettings: AssociationSettings) => {
    setSettings(newSettings);
    saveToStorage(STORAGE_KEYS.SETTINGS, newSettings);

    const newLog: ActivityLog = {
      id: activityLogs.length + 1,
      timestamp: new Date().toISOString(),
      advocate_id: null,
      action_type: 'SETTINGS_CHANGED',
      performed_by_id: currentUser?.id || 'system',
      payload: { message: 'Association settings modified' },
    };
    const newLogs = [...activityLogs, newLog];
    setActivityLogs(newLogs);
    saveToStorage(STORAGE_KEYS.ACTIVITY_LOGS, newLogs);
  };

  // --- DERIVATIONS ---

  const getAdvocateDueBalance = (advocateId: string): number => {
    return dues
      .filter((d) => d.advocate_id === advocateId && d.status === 'UNPAID')
      .reduce((acc, curr) => acc + curr.total_due_amount, 0);
  };

  const getAdvocateDues = (advocateId: string): MonthlyDue[] => {
    return dues.filter((d) => d.advocate_id === advocateId);
  };

  const getAdvocateReceipts = (advocateId: string): PaymentTransaction[] => {
    return transactions.filter((t) => t.advocate_id === advocateId).sort((a,b) => b.id - a.id);
  };

  const getAdvocateTimeline = (advocateId: string): ActivityLog[] => {
    return activityLogs.filter((l) => l.advocate_id === advocateId).sort((a,b) => b.id - a.id);
  };

  const getOperationalNotifications = () => {
    const alerts: { id: string; type: 'arrears' | 'billing' | 'compliance' | 'reconciliation'; text: string; link?: string }[] = [];

    // 1. Dues older than 12 months (e.g. unpaid dues from 2024 or early 2025)
    // Find advocates with UNPAID dues where year < 2025 or (year === 2025 and month <= '06')
    const activeAdvocates = advocates.filter((a) => a.status === 'ACTIVE');
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
          link: `/admin/advocates/${adv.id}`,
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
          link: `/admin/advocates/${adv.id}`,
        });
      }
    });

    // 3. Billing alert: September additional fee rule parameters missing in settings
    const hasOnamFee = additionalFeeRules.some(f => f.name.toLowerCase().includes('onam') && f.active);
    if (!hasOnamFee) {
      alerts.push({
        id: 'billing-onam',
        type: 'billing',
        text: 'Billing configuration warning: September/Onam Contribution fee is not configured in Additional Fee Rules.',
        link: '/admin/settings',
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

  const isAdvocateEligibleForCertificate = (advocateId: string): { eligible: boolean; reason: string | null } => {
    const adv = advocates.find((a) => a.id === advocateId);
    if (!adv) {
      return { eligible: false, reason: 'Advocate not found.' };
    }
    
    // Condition 1: Advocate Status == ACTIVE
    if (adv.status !== 'ACTIVE') {
      const statusText = adv.status.charAt(0) + adv.status.slice(1).toLowerCase();
      return { eligible: false, reason: `Advocate status is currently ${statusText}. Only ACTIVE members are eligible.` };
    }

    // Condition 2: Outstanding Balance == ₹0
    const balance = getAdvocateDueBalance(advocateId);
    if (balance > 0) {
      return { eligible: false, reason: `Outstanding dues of ₹${balance.toFixed(2)} must be cleared.` };
    }

    return { eligible: true, reason: null };
  };

  const updateUser = (userId: string, updatedFields: Partial<User>) => {
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) return;

    const user = users[userIndex];
    let newPermissions = updatedFields.user_permissions || user.user_permissions;
    if (updatedFields.groups || updatedFields.additional_permissions !== undefined) {
      const targetGroups = updatedFields.groups || user.groups;
      const targetAdditional = updatedFields.additional_permissions !== undefined ? updatedFields.additional_permissions : (user.additional_permissions || []);
      
      const groupPerms = new Set<string>();
      targetGroups.forEach((group) => {
        const perms = GROUP_PERMISSIONS[group] || [];
        perms.forEach((p) => groupPerms.add(p));
      });
      targetAdditional.forEach((p) => groupPerms.add(p));
      newPermissions = Array.from(groupPerms);
    }

    const updatedUserObj = {
      ...user,
      ...updatedFields,
      user_permissions: newPermissions,
    };

    const newUsers = [...users];
    newUsers[userIndex] = updatedUserObj;

    if (currentUser && currentUser.id === userId) {
      setCurrentUser(updatedUserObj);
      sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER_SESSION, JSON.stringify(updatedUserObj));
    }

    const newLog: ActivityLog = {
      id: activityLogs.length + 1,
      timestamp: new Date().toISOString(),
      advocate_id: advocates.find((a) => a.user_id === userId)?.id || null,
      action_type: 'USER_GROUPS_CHANGED',
      performed_by_id: currentUser?.id || 'system',
      payload: { 
        user_id: userId, 
        username: user.username,
        groups: updatedUserObj.groups,
        permissions: updatedUserObj.user_permissions
      },
    };
    const newLogs = [...activityLogs, newLog];

    setUsers(newUsers);
    setActivityLogs(newLogs);

    saveToStorage(STORAGE_KEYS.USERS, newUsers);
    saveToStorage(STORAGE_KEYS.ACTIVITY_LOGS, newLogs);
  };

  const resetAllData = () => {
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER_SESSION);
    setCurrentUser(null);
    initializeDB(true);
  };

  return (
    <MockDBContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        setUsers,
        advocates,
        setAdvocates,
        dues,
        setDues,
        transactions,
        setTransactions,
        paymentLines,
        setPaymentLines,
        activityLogs,
        setActivityLogs,
        settings,
        setSettings,
        officePositions,
        setOfficePositions,
        officeTerms,
        setOfficeTerms,
        additionalFeeRules,
        setAdditionalFeeRules,
        treasuryTransactions,
        setTreasuryTransactions,
        paymentRequests,
        setPaymentRequests,
        login,
        logout,
        registerAdvocate,
        updateAdvocateProfile,
        checkoutBasket,
        waiveDue,
        updateSettings,
        getAdvocateDueBalance,
        getAdvocateDues,
        getAdvocateReceipts,
        getAdvocateTimeline,
        getOperationalNotifications,
        isAdvocateEligibleForCertificate,
        updateUser,
        resetAllData,
      }}
    >
      {children}
    </MockDBContext.Provider>
  );
};

export const useMockDB = () => {
  const context = useContext(MockDBContext);
  if (context === undefined) {
    throw new Error('useMockDB must be used within a MockDBProvider');
  }
  return context;
};
