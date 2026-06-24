export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login/`,
    LOGOUT: `${API_BASE_URL}/auth/logout/`,
    USER: `${API_BASE_URL}/auth/user/`,
  },
  ADVOCATES: {
    LIST: `${API_BASE_URL}/advocates/`,
    DETAIL: (id: string) => `${API_BASE_URL}/advocates/${id}/`,
    REGISTER: `${API_BASE_URL}/advocates/register/`,
    UPDATE: (id: string) => `${API_BASE_URL}/advocates/${id}/update/`,
  },
  PAYMENTS: {
    CHECKOUT: `${API_BASE_URL}/payments/checkout/`,
    WAIVE: (id: number) => `${API_BASE_URL}/payments/dues/${id}/waive/`,
    DUES: (advocateId: string) => `${API_BASE_URL}/payments/dues/?advocate=${advocateId}`,
    RECEIPTS: (advocateId: string) => `${API_BASE_URL}/payments/receipts/?advocate=${advocateId}`,
  },
  SETTINGS: {
    DETAIL: `${API_BASE_URL}/settings/`,
    USERS: `${API_BASE_URL}/settings/users/`,
    UPDATE_USER: (id: string) => `${API_BASE_URL}/settings/users/${id}/`,
  },
};
