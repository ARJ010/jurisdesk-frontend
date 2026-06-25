import type { User, EmployeeProfile, ActivityLog, ActivityLogType } from '@/types';
import { GROUP_PERMISSIONS } from '@/config/permissions';

// Helper to generate UUIDs
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Build a new employee user account and employee profile.
 */
export const buildNewEmployee = (
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
  },
  currentLogsCount: number,
  currentUser: User | null
) => {
  const newUserId = generateUUID();
  const newEmployeeId = generateUUID();

  // Split name
  const nameParts = employeeData.fullName.trim().split(' ');
  const first = nameParts[0] || 'Employee';
  const last = nameParts.slice(1).join(' ');

  // Compute permissions based on groups + additional
  const computedPermissionsSet = new Set<string>();
  userData.groups.forEach((g) => {
    const perms = GROUP_PERMISSIONS[g] || [];
    perms.forEach((p) => computedPermissionsSet.add(p));
  });
  userData.additionalPermissions.forEach((p) => computedPermissionsSet.add(p));
  const computedPermissions = Array.from(computedPermissionsSet);

  const newUser: User = {
    id: newUserId,
    username: userData.username.trim(),
    email: employeeData.email.trim(),
    first_name: first,
    last_name: last,
    is_active: userData.isActive,
    groups: userData.groups,
    user_permissions: computedPermissions,
    additional_permissions: userData.additionalPermissions,
    password: userData.password || 'pass@123',
    must_change_password: true, // force password reset on first login
  };

  const newEmployee: EmployeeProfile = {
    id: newEmployeeId,
    user_id: newUserId,
    employee_code: employeeData.employeeCode.trim(),
    full_name: employeeData.fullName.trim(),
    designation: employeeData.designation.trim(),
    mobile: employeeData.mobile.trim(),
    email: employeeData.email.trim(),
    joining_date: employeeData.joiningDate,
    remarks: employeeData.remarks?.trim() || '',
    is_active: userData.isActive,
    status: userData.isActive ? 'ACTIVE' : 'SUSPENDED',
  };

  const newLog: ActivityLog = {
    id: currentLogsCount + 1,
    timestamp: new Date().toISOString(),
    advocate_id: null,
    action_type: 'EMPLOYEE_CREATED' as ActivityLogType,
    performed_by_id: currentUser?.id || 'system',
    payload: {
      employee_id: newEmployeeId,
      employee_code: newEmployee.employee_code,
      username: newUser.username,
      full_name: newEmployee.full_name,
    },
  };

  return {
    newUser,
    newEmployee,
    newLog,
  };
};

/**
 * Build updated employee and user records with appropriate activity logs.
 */
export const buildUpdatedEmployee = (
  employee: EmployeeProfile,
  user: User,
  updatedFields: Partial<EmployeeProfile>,
  updatedUserFields: Partial<User>,
  currentLogsCount: number,
  currentUser: User | null,
  actionType: ActivityLogType = 'EMPLOYEE_UPDATED' as ActivityLogType,
  logDetails?: Record<string, any>
) => {
  const updatedEmployee = { ...employee, ...updatedFields };

  // Re-split name if full_name changes
  let nameFields = {};
  if (updatedFields.full_name) {
    const nameParts = updatedFields.full_name.trim().split(' ');
    const first = nameParts[0] || 'Employee';
    const last = nameParts.slice(1).join(' ');
    nameFields = { first_name: first, last_name: last };
  }

  // Update permissions if groups or additional permissions change
  let permissionFields = {};
  if (updatedUserFields.groups || updatedUserFields.additional_permissions) {
    const nextGroups = updatedUserFields.groups || user.groups;
    const nextAdd = updatedUserFields.additional_permissions || user.additional_permissions || [];
    const computedPermissionsSet = new Set<string>();
    nextGroups.forEach((g) => {
      const perms = GROUP_PERMISSIONS[g] || [];
      perms.forEach((p) => computedPermissionsSet.add(p));
    });
    nextAdd.forEach((p) => computedPermissionsSet.add(p));
    permissionFields = { user_permissions: Array.from(computedPermissionsSet) };
  }

  const updatedUser = {
    ...user,
    ...updatedUserFields,
    ...nameFields,
    ...permissionFields,
  };

  // Build diff payload for logging
  const diffBefore: Record<string, any> = {};
  const diffAfter: Record<string, any> = {};

  Object.keys(updatedFields).forEach((key) => {
    const val = updatedFields[key as keyof EmployeeProfile];
    const oldVal = employee[key as keyof EmployeeProfile];
    if (val !== oldVal) {
      diffBefore[key] = oldVal;
      diffAfter[key] = val;
    }
  });

  const newLog: ActivityLog = {
    id: currentLogsCount + 1,
    timestamp: new Date().toISOString(),
    advocate_id: null,
    action_type: actionType,
    performed_by_id: currentUser?.id || 'system',
    payload: {
      employee_id: employee.id,
      employee_code: employee.employee_code,
      diff_before: diffBefore,
      diff_after: diffAfter,
      ...logDetails,
    },
  };

  return {
    updatedEmployee,
    updatedUser,
    newLog,
  };
};
