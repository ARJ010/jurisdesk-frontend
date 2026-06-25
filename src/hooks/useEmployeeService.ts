import { useMockDB } from '@/contexts/MockDBContext';
import { buildNewEmployee, buildUpdatedEmployee } from '@/services/employeeService';
import { STORAGE_KEYS } from '@/config/storage';
import type { EmployeeProfile, User, ActivityLogType } from '@/types';

export const useEmployeeService = () => {
  const {
    currentUser,
    users,
    setUsers,
    employeeProfiles,
    setEmployeeProfiles,
    activityLogs,
    setActivityLogs,
  } = useMockDB();

  const createEmployee = (
    employeeData: {
      fullName: string;
      mobile: string;
      email: string;
      employeeCode: string;
      designation: string;
      joiningDate: string;
      remarks?: string;
    },
    userData: {
      username: string;
      password?: string;
      isActive: boolean;
      groups: ('Advocate' | 'Office Staff' | 'Admin Advocate')[];
      additionalPermissions: string[];
    }
  ) => {
    const result = buildNewEmployee(
      employeeData,
      userData,
      activityLogs.length,
      currentUser
    );

    const updatedUsers = [...users, result.newUser];
    const updatedEmployees = [...employeeProfiles, result.newEmployee];
    const updatedLogs = [...activityLogs, result.newLog];

    setUsers(updatedUsers);
    setEmployeeProfiles(updatedEmployees);
    setActivityLogs(updatedLogs);

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    localStorage.setItem(STORAGE_KEYS.EMPLOYEE_PROFILES, JSON.stringify(updatedEmployees));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(updatedLogs));
    
    return result.newEmployee;
  };

  const updateEmployee = (
    employeeId: string,
    updatedFields: Partial<EmployeeProfile>,
    updatedUserFields: Partial<User>
  ) => {
    const employee = employeeProfiles.find((e) => e.id === employeeId);
    if (!employee) return;

    const user = users.find((u) => u.id === employee.user_id);
    if (!user) return;

    const result = buildUpdatedEmployee(
      employee,
      user,
      updatedFields,
      updatedUserFields,
      activityLogs.length,
      currentUser,
      'EMPLOYEE_UPDATED' as ActivityLogType
    );

    const employeeIndex = employeeProfiles.findIndex((e) => e.id === employeeId);
    const newEmployees = [...employeeProfiles];
    newEmployees[employeeIndex] = result.updatedEmployee;

    const userIndex = users.findIndex((u) => u.id === employee.user_id);
    const newUsers = [...users];
    newUsers[userIndex] = result.updatedUser;

    const newLogs = [...activityLogs, result.newLog];

    setEmployeeProfiles(newEmployees);
    setUsers(newUsers);
    setActivityLogs(newLogs);

    localStorage.setItem(STORAGE_KEYS.EMPLOYEE_PROFILES, JSON.stringify(newEmployees));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(newLogs));
  };

  const disableEmployee = (employeeId: string) => {
    const employee = employeeProfiles.find((e) => e.id === employeeId);
    if (!employee) return;

    const user = users.find((u) => u.id === employee.user_id);
    if (!user) return;

    const result = buildUpdatedEmployee(
      employee,
      user,
      { is_active: false, status: 'SUSPENDED' },
      { is_active: false },
      activityLogs.length,
      currentUser,
      'EMPLOYEE_DISABLED' as ActivityLogType
    );

    const employeeIndex = employeeProfiles.findIndex((e) => e.id === employeeId);
    const newEmployees = [...employeeProfiles];
    newEmployees[employeeIndex] = result.updatedEmployee;

    const userIndex = users.findIndex((u) => u.id === employee.user_id);
    const newUsers = [...users];
    newUsers[userIndex] = result.updatedUser;

    const newLogs = [...activityLogs, result.newLog];

    setEmployeeProfiles(newEmployees);
    setUsers(newUsers);
    setActivityLogs(newLogs);

    localStorage.setItem(STORAGE_KEYS.EMPLOYEE_PROFILES, JSON.stringify(newEmployees));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(newLogs));
  };

  const enableEmployee = (employeeId: string) => {
    const employee = employeeProfiles.find((e) => e.id === employeeId);
    if (!employee) return;

    const user = users.find((u) => u.id === employee.user_id);
    if (!user) return;

    const result = buildUpdatedEmployee(
      employee,
      user,
      { is_active: true, status: 'ACTIVE' },
      { is_active: true },
      activityLogs.length,
      currentUser,
      'EMPLOYEE_ENABLED' as ActivityLogType
    );

    const employeeIndex = employeeProfiles.findIndex((e) => e.id === employeeId);
    const newEmployees = [...employeeProfiles];
    newEmployees[employeeIndex] = result.updatedEmployee;

    const userIndex = users.findIndex((u) => u.id === employee.user_id);
    const newUsers = [...users];
    newUsers[userIndex] = result.updatedUser;

    const newLogs = [...activityLogs, result.newLog];

    setEmployeeProfiles(newEmployees);
    setUsers(newUsers);
    setActivityLogs(newLogs);

    localStorage.setItem(STORAGE_KEYS.EMPLOYEE_PROFILES, JSON.stringify(newEmployees));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(newLogs));
  };

  const retireEmployee = (employeeId: string) => {
    const employee = employeeProfiles.find((e) => e.id === employeeId);
    if (!employee) return;

    const user = users.find((u) => u.id === employee.user_id);
    if (!user) return;

    const result = buildUpdatedEmployee(
      employee,
      user,
      { is_active: false, status: 'RETIRED' },
      { is_active: false },
      activityLogs.length,
      currentUser,
      'EMPLOYEE_RETIRED' as ActivityLogType
    );

    const employeeIndex = employeeProfiles.findIndex((e) => e.id === employeeId);
    const newEmployees = [...employeeProfiles];
    newEmployees[employeeIndex] = result.updatedEmployee;

    const userIndex = users.findIndex((u) => u.id === employee.user_id);
    const newUsers = [...users];
    newUsers[userIndex] = result.updatedUser;

    const newLogs = [...activityLogs, result.newLog];

    setEmployeeProfiles(newEmployees);
    setUsers(newUsers);
    setActivityLogs(newLogs);

    localStorage.setItem(STORAGE_KEYS.EMPLOYEE_PROFILES, JSON.stringify(newEmployees));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(newLogs));
  };

  const resetEmployeePassword = (employeeId: string) => {
    const employee = employeeProfiles.find((e) => e.id === employeeId);
    if (!employee) return null;

    const user = users.find((u) => u.id === employee.user_id);
    if (!user) return null;

    // Generate a temporary password (e.g. HBA-XXXX)
    const tempPassword = 'HBA-' + Math.floor(1000 + Math.random() * 9000).toString();

    const result = buildUpdatedEmployee(
      employee,
      user,
      {},
      { password: tempPassword, must_change_password: true },
      activityLogs.length,
      currentUser,
      'PASSWORD_RESET' as ActivityLogType,
      { reset_by: currentUser?.username || 'admin', temp_password: tempPassword }
    );

    const userIndex = users.findIndex((u) => u.id === employee.user_id);
    const newUsers = [...users];
    newUsers[userIndex] = result.updatedUser;

    const newLogs = [...activityLogs, result.newLog];

    setUsers(newUsers);
    setActivityLogs(newLogs);

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(newLogs));

    return tempPassword;
  };

  return {
    employeeProfiles,
    createEmployee,
    updateEmployee,
    disableEmployee,
    enableEmployee,
    retireEmployee,
    resetEmployeePassword,
  };
};
