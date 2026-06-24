import { useMockDB } from '@/contexts/MockDBContext';
import { buildNewAdvocate, buildUpdatedProfile } from '@/services/advocateService';
import { STORAGE_KEYS } from '@/config/storage';
import type { Advocate, User, ActivityLogType } from '@/types';

export const useAdvocateService = () => {
  const {
    currentUser,
    users,
    setUsers,
    advocates,
    setAdvocates,
    dues,
    setDues,
    activityLogs,
    setActivityLogs,
    settings,
    additionalFeeRules,
  } = useMockDB();

  const registerAdvocate = (advocateData: Omit<Advocate, 'id' | 'user_id'>, name: string, email: string) => {
    const result = buildNewAdvocate(
      settings,
      advocateData,
      name,
      email,
      dues.length,
      activityLogs.length,
      currentUser,
      additionalFeeRules
    );

    const updatedUsers = [...users, result.newUser];
    const updatedAdvocates = [...advocates, result.newAdvocate];
    const updatedDues = [...dues, ...result.newDues];
    const updatedLogs = [...activityLogs, ...result.newLogs];

    setUsers(updatedUsers);
    setAdvocates(updatedAdvocates);
    setDues(updatedDues);
    setActivityLogs(updatedLogs);

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    localStorage.setItem(STORAGE_KEYS.ADVOCATES, JSON.stringify(updatedAdvocates));
    localStorage.setItem(STORAGE_KEYS.DUES, JSON.stringify(updatedDues));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(updatedLogs));
  };

  const updateAdvocateProfile = (
    id: string,
    updatedFields: Partial<Advocate>,
    updatedUser: Partial<User>,
    remarks?: string,
    actionTypeOverride?: ActivityLogType
  ) => {
    const advocate = advocates.find((a) => a.id === id);
    if (!advocate) return;

    const user = users.find((u) => u.id === advocate.user_id);
    const result = buildUpdatedProfile(
      advocate,
      user,
      updatedFields,
      updatedUser,
      activityLogs.length,
      currentUser,
      remarks,
      actionTypeOverride
    );

    const advocateIndex = advocates.findIndex((a) => a.id === id);
    const newAdvocates = [...advocates];
    newAdvocates[advocateIndex] = result.updatedAdvocate;

    let newUsers = [...users];
    if (result.updatedUser) {
      const userIndex = users.findIndex((u) => u.id === advocate.user_id);
      if (userIndex !== -1) {
        newUsers[userIndex] = result.updatedUser;
      }
    }

    const newLogs = [...activityLogs, result.newLog];

    setAdvocates(newAdvocates);
    setUsers(newUsers);
    setActivityLogs(newLogs);

    localStorage.setItem(STORAGE_KEYS.ADVOCATES, JSON.stringify(newAdvocates));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(newLogs));
  };

  return {
    advocates,
    registerAdvocate,
    updateAdvocateProfile,
  };
};
