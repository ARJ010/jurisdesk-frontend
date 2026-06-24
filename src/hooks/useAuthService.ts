import { useMockDB } from '@/contexts/MockDBContext';
import { authenticateUser, verifyPassword } from '@/services/authService';
import { STORAGE_KEYS } from '@/config/storage';
import type { ActivityLog } from '@/types';

export const useAuthService = () => {
  const { 
    currentUser, 
    setCurrentUser, 
    users, 
    activityLogs, 
    setActivityLogs, 
    advocates 
  } = useMockDB();

  const login = async (username: string, password: string) => {
    const user = await authenticateUser(users, username, password);
    if (user) {
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
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(updatedLogs));
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
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(updatedLogs));
    }
    setCurrentUser(null);
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER_SESSION);
  };

  const verifyCurrentPassword = async (password: string) => {
    return verifyPassword(password);
  };

  return {
    currentUser,
    login,
    logout,
    verifyCurrentPassword,
  };
};
