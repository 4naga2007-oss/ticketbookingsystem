import { apiClient } from './api';
import type { User, Passenger, UserAccount, SessionContext } from '../types/domain';

export interface RegisterPayload {
  userName: string;
  email: string;
  password: string;
  name: string;
  phoneNo: string;
}

export interface LoginPayload {
  emailOrUsername: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    passenger?: Passenger;
    admin?: { adminId: number; name: string };
    user?: User;
    account?: UserAccount;
    session: SessionContext;
  };
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/register', payload).then(r => r.data),

  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload).then(r => r.data),

  logout: () =>
    apiClient.post('/auth/logout').then(r => r.data),

  me: () =>
    apiClient.get<{ success: boolean; data: { user: User; passenger?: Passenger; account?: UserAccount } }>('/auth/me').then(r => r.data),

  updateProfile: (payload: { name: string; phoneNo: string }) =>
    apiClient.put('/auth/profile', payload).then(r => r.data),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiClient.post('/auth/change-password', payload).then(r => r.data),

  oauthGoogle: (token: string) =>
    apiClient.post<AuthResponse>('/auth/oauth/google', { token }).then(r => r.data),

  oauthApple: (token: string) =>
    apiClient.post<AuthResponse>('/auth/oauth/apple', { token }).then(r => r.data),
};
