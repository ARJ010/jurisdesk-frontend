import { useMockDB } from '@/contexts/MockDBContext';
import { 
  calculateUserUpdate,
  addOfficePosition,
  updateOfficePosition,
  deleteOfficePosition,
  reorderOfficePositions,
  addAdditionalFeeRule,
  updateAdditionalFeeRule,
  deleteAdditionalFeeRule,
  calculateAdvocateOfficeTermsUpdate
} from '@/services/settingsService';
import { STORAGE_KEYS } from '@/config/storage';
import type { AssociationSettings, User, ActivityLog, OfficePosition, AdditionalFeeRule } from '@/types';

export const useSettingsService = () => {
  const {
    currentUser,
    setCurrentUser,
    users,
    setUsers,
    advocates,
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
  } = useMockDB();

  const updateSettings = (newSettings: AssociationSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));

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
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(newLogs));
  };

  const updateUser = (userId: string, updatedFields: Partial<User>) => {
    const result = calculateUserUpdate(
      users,
      activityLogs,
      currentUser,
      userId,
      updatedFields,
      advocates
    );
    if (!result) return;

    const newLogs = [...activityLogs, result.newLog];

    setUsers(result.updatedUsers);
    setActivityLogs(newLogs);

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(result.updatedUsers));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(newLogs));

    if (currentUser && currentUser.id === userId) {
      setCurrentUser(result.updatedUserObj);
      sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER_SESSION, JSON.stringify(result.updatedUserObj));
    }
  };

  const addPos = (pos: Omit<OfficePosition, 'id'>) => {
    const updated = addOfficePosition(officePositions, pos);
    setOfficePositions(updated);
    localStorage.setItem(STORAGE_KEYS.OFFICE_POSITIONS, JSON.stringify(updated));
  };

  const updatePos = (id: string, fields: Partial<OfficePosition>) => {
    const updated = updateOfficePosition(officePositions, id, fields);
    setOfficePositions(updated);
    localStorage.setItem(STORAGE_KEYS.OFFICE_POSITIONS, JSON.stringify(updated));
  };

  const deletePos = (id: string) => {
    const updated = deleteOfficePosition(officePositions, id);
    setOfficePositions(updated);
    localStorage.setItem(STORAGE_KEYS.OFFICE_POSITIONS, JSON.stringify(updated));
  };

  const reorderPos = (ids: string[]) => {
    const updated = reorderOfficePositions(officePositions, ids);
    setOfficePositions(updated);
    localStorage.setItem(STORAGE_KEYS.OFFICE_POSITIONS, JSON.stringify(updated));
  };

  const addFee = (fee: Omit<AdditionalFeeRule, 'id'>) => {
    const updated = addAdditionalFeeRule(additionalFeeRules, fee);
    setAdditionalFeeRules(updated);
    localStorage.setItem(STORAGE_KEYS.ADDITIONAL_FEE_RULES, JSON.stringify(updated));
  };

  const updateFee = (id: string, fields: Partial<AdditionalFeeRule>) => {
    const updated = updateAdditionalFeeRule(additionalFeeRules, id, fields);
    setAdditionalFeeRules(updated);
    localStorage.setItem(STORAGE_KEYS.ADDITIONAL_FEE_RULES, JSON.stringify(updated));
  };

  const deleteFee = (id: string) => {
    const updated = deleteAdditionalFeeRule(additionalFeeRules, id);
    setAdditionalFeeRules(updated);
    localStorage.setItem(STORAGE_KEYS.ADDITIONAL_FEE_RULES, JSON.stringify(updated));
  };

  const updateOfficeTerms = (advocateId: string, advocateName: string, selectedPositionIds: string[]) => {
    const result = calculateAdvocateOfficeTermsUpdate(
      officeTerms,
      advocateId,
      selectedPositionIds,
      officePositions,
      activityLogs,
      currentUser,
      advocateName
    );
    setOfficeTerms(result.updatedTerms);
    localStorage.setItem(STORAGE_KEYS.OFFICE_TERMS, JSON.stringify(result.updatedTerms));

    setActivityLogs(result.newLogs);
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(result.newLogs));
  };

  return {
    settings,
    updateSettings,
    updateUser,
    officePositions,
    officeTerms,
    additionalFeeRules,
    addPos,
    updatePos,
    deletePos,
    reorderPos,
    addFee,
    updateFee,
    deleteFee,
    updateOfficeTerms,
  };
};
