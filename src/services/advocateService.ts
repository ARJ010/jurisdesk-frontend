import type { User, Advocate, MonthlyDue, ActivityLog, ActivityLogType, AssociationSettings, AdditionalFeeRule } from '@/types';
import { calculateAdditionalDuesForPeriod } from './paymentService';

// Helper to generate UUIDs
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Pure service to build new advocate objects and initial dues.
 */
export const buildNewAdvocate = (
  settings: AssociationSettings,
  advocateData: Omit<Advocate, 'id' | 'user_id'>,
  name: string,
  email: string,
  currentDuesCount: number,
  currentLogsCount: number,
  currentUser: User | null,
  additionalFeeRules: AdditionalFeeRule[]
) => {
  const newUserId = generateUUID();
  const newAdvocateId = generateUUID();

  // 1. Create User object
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

  // 2. Create Advocate profile
  const newAdvocate: Advocate = {
    ...advocateData,
    id: newAdvocateId,
    user_id: newUserId,
    picture_url: null,
    status: 'ACTIVE',
  };

  // 3. Generate initial dues from joined date up to current month (June 2026)
  const newDues: MonthlyDue[] = [];
  const joinDate = new Date(advocateData.joined_date);
  const startYear = joinDate.getFullYear();
  const startMonth = joinDate.getMonth() + 1;

  const currentYear = 2026;
  const currentMonth = 6;

  let dueIdCounter = currentDuesCount + 1;

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
  const logCounter = currentLogsCount + 1;
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

  return {
    newUser,
    newAdvocate,
    newDues,
    newLogs: [userLog, memberLog],
  };
};

/**
 * Pure service to update advocate and user profile details.
 */
export const buildUpdatedProfile = (
  advocate: Advocate,
  user: User | undefined,
  updatedFields: Partial<Advocate>,
  updatedUser: Partial<User>,
  currentLogsCount: number,
  currentUser: User | null,
  remarks?: string,
  actionTypeOverride?: ActivityLogType
) => {
  const newAdvocate = { ...advocate, ...updatedFields };
  const newUser = user ? { ...user, ...updatedUser } : undefined;

  const diffBefore: Record<string, any> = {};
  const diffAfter: Record<string, any> = {};
  let hasSensitiveOrRareChange = false;

  const sensitiveFieldsList = ['enrolment_no', 'date_of_enrolment', 'joined_date', 'kawf_no'];
  const rareFieldsList = ['date_of_birth'];

  Object.keys(updatedFields).forEach((key) => {
    const val = updatedFields[key as keyof Advocate];
    const oldVal = advocate[key as keyof Advocate];
    if (val !== oldVal) {
      if (sensitiveFieldsList.includes(key) || rareFieldsList.includes(key)) {
        hasSensitiveOrRareChange = true;
      }
      diffBefore[key] = oldVal;
      diffAfter[key] = val;
    }
  });

  if (user) {
    if (updatedUser.email !== undefined && updatedUser.email !== user.email) {
      diffBefore['email'] = user.email;
      diffAfter['email'] = updatedUser.email;
    }
    if (updatedUser.first_name !== undefined && updatedUser.first_name !== user.first_name) {
      diffBefore['first_name'] = user.first_name;
      diffAfter['first_name'] = updatedUser.first_name;
      hasSensitiveOrRareChange = true;
    }
    if (updatedUser.last_name !== undefined && updatedUser.last_name !== user.last_name) {
      diffBefore['last_name'] = user.last_name;
      diffAfter['last_name'] = updatedUser.last_name;
      hasSensitiveOrRareChange = true;
    }
  }

  const actionType = actionTypeOverride || (hasSensitiveOrRareChange ? 'REGISTRY_UPDATED' : 'PROFILE_UPDATED');

  const payload: Record<string, any> = {
    changed: Object.keys(diffAfter)
  };

  // For administrative updates or registry logs, or if we want detailed diffs, include before/after
  if (hasSensitiveOrRareChange || actionType === 'PROFILE_UPDATED_BY_ADMIN' || actionType === 'REGISTRY_UPDATED') {
    payload.before = diffBefore;
    payload.after = diffAfter;
    if (remarks) {
      payload.remarks = remarks;
    }
  }

  const newLog: ActivityLog = {
    id: currentLogsCount + 1,
    timestamp: new Date().toISOString(),
    advocate_id: advocate.id,
    action_type: actionType,
    performed_by_id: currentUser?.id || 'system',
    payload,
  };

  return {
    updatedAdvocate: newAdvocate,
    updatedUser: newUser,
    newLog,
  };
};
