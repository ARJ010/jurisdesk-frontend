import type { User, ActivityLog, Advocate, OfficePosition, OfficeTerm, AdditionalFeeRule } from '@/types';
import { GROUP_PERMISSIONS } from '@/config/permissions';

/**
 * Pure function to calculate user group privilege updates, additional permissions, and logs.
 */
export const calculateUserUpdate = (
  users: User[],
  activityLogs: ActivityLog[],
  currentUser: User | null,
  userId: string,
  updatedFields: Partial<User>,
  advocates: Advocate[]
) => {
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) return null;

  const user = users[userIndex];
  let newPermissions = updatedFields.user_permissions || user.user_permissions;

  if (updatedFields.groups || updatedFields.additional_permissions !== undefined) {
    const targetGroups = updatedFields.groups || user.groups;
    const targetAdditional = updatedFields.additional_permissions !== undefined 
      ? updatedFields.additional_permissions 
      : (user.additional_permissions || []);
    
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

  return {
    updatedUsers: newUsers,
    updatedUserObj,
    newLog,
  };
};

export const addOfficePosition = (
  positions: OfficePosition[],
  pos: Omit<OfficePosition, 'id'>
): OfficePosition[] => {
  const nextId = positions.length > 0 ? Math.max(...positions.map((p) => parseInt(p.id.replace('pos-', '')) || 0)) + 1 : 1;
  const newPos: OfficePosition = {
    ...pos,
    id: `pos-${nextId}`,
    display_order: positions.length + 1
  };
  return [...positions, newPos];
};

export const updateOfficePosition = (
  positions: OfficePosition[],
  id: string,
  updatedFields: Partial<OfficePosition>
): OfficePosition[] => {
  return positions.map((p) => (p.id === id ? { ...p, ...updatedFields } : p));
};

export const deleteOfficePosition = (
  positions: OfficePosition[],
  id: string
): OfficePosition[] => {
  return positions.filter((p) => p.id !== id);
};

export const reorderOfficePositions = (
  positions: OfficePosition[],
  ids: string[]
): OfficePosition[] => {
  const positionsMap = new Map(positions.map(p => [p.id, p]));
  const ordered: OfficePosition[] = [];
  ids.forEach((id, index) => {
    const pos = positionsMap.get(id);
    if (pos) {
      ordered.push({
        ...pos,
        display_order: index + 1
      });
    }
  });
  positions.forEach(p => {
    if (!ids.includes(p.id)) {
      ordered.push({
        ...p,
        display_order: ordered.length + 1
      });
    }
  });
  return ordered;
};

export const addAdditionalFeeRule = (
  fees: AdditionalFeeRule[],
  fee: Omit<AdditionalFeeRule, 'id'>
): AdditionalFeeRule[] => {
  const nextId = fees.length > 0 ? Math.max(...fees.map((f) => parseInt(f.id.replace('fee-', '')) || 0)) + 1 : 1;
  const newFee: AdditionalFeeRule = {
    ...fee,
    id: `fee-${nextId}`
  };
  return [...fees, newFee];
};

export const updateAdditionalFeeRule = (
  fees: AdditionalFeeRule[],
  id: string,
  updatedFields: Partial<AdditionalFeeRule>
): AdditionalFeeRule[] => {
  return fees.map((f) => (f.id === id ? { ...f, ...updatedFields } : f));
};

export const deleteAdditionalFeeRule = (
  fees: AdditionalFeeRule[],
  id: string
): AdditionalFeeRule[] => {
  return fees.filter((f) => f.id !== id);
};

export interface OfficeTermInput {
  positionId: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}

export const calculateAdvocateOfficeTermsUpdate = (
  terms: OfficeTerm[],
  advocateId: string,
  selectedPositionIds: string[],
  positions: OfficePosition[],
  activityLogs: ActivityLog[],
  currentUser: User | null,
  advocateName: string
) => {
  const todayStr = new Date().toISOString().split('T')[0];
  let updatedTerms = [...terms];
  const newLogs = [...activityLogs];

  // Find the positions currently held by this advocate
  const currentTermsForAdvocate = terms.filter(t => t.advocate === advocateId && t.is_current);
  const currentPositionIds = currentTermsForAdvocate.map(t => t.position);

  // 1. Close terms for positions that are unchecked
  currentTermsForAdvocate.forEach(term => {
    if (!selectedPositionIds.includes(term.position)) {
      updatedTerms = updatedTerms.map(t => {
        if (t.id === term.id) {
          return { ...t, is_current: false, end_date: todayStr };
        }
        return t;
      });

      const posObj = positions.find(p => p.id === term.position);
      const posName = posObj ? posObj.name : term.position;

      newLogs.push({
        id: newLogs.length + 1,
        timestamp: new Date().toISOString(),
        advocate_id: advocateId,
        action_type: 'PROFILE_UPDATED',
        performed_by_id: currentUser?.id || 'system',
        payload: { message: `Closed office position term '${posName}' for ${advocateName}` }
      });
    }
  });

  // 2. Open terms for positions that are newly checked
  selectedPositionIds.forEach(positionId => {
    if (!currentPositionIds.includes(positionId)) {
      const posObj = positions.find(p => p.id === positionId);
      const isMultiBearer = positionId === 'pos-committee' || 
                            positionId === 'pos-5' || // Executive Committee Member
                            positionId === 'pos-6' || // Library Committee Member
                            (posObj ? (posObj.name.toLowerCase().includes('committee') || posObj.name.toLowerCase().includes('member')) : false);

      if (!isMultiBearer) {
        // Close any other advocate's current term for this single-bearer position
        updatedTerms = updatedTerms.map(t => {
          if (t.position === positionId && t.is_current && t.advocate !== advocateId) {
            return { ...t, is_current: false, end_date: todayStr };
          }
          return t;
        });
      }

      // Create a new term for this advocate
      const nextId = updatedTerms.length > 0 ? Math.max(...updatedTerms.map(t => parseInt(t.id.replace('term-', '')) || 0)) + 1 : 1;
      updatedTerms.push({
        id: `term-${nextId}`,
        advocate: advocateId,
        position: positionId,
        start_date: todayStr,
        end_date: null,
        is_current: true
      });

      const posName = posObj ? posObj.name : positionId;

      newLogs.push({
        id: newLogs.length + 1,
        timestamp: new Date().toISOString(),
        advocate_id: advocateId,
        action_type: 'PROFILE_UPDATED',
        performed_by_id: currentUser?.id || 'system',
        payload: { message: `Assigned office position term '${posName}' for ${advocateName}` }
      });
    }
  });

  return {
    updatedTerms,
    newLogs
  };
};
