import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, type RegisterPayload, type LoginPayload } from '../services/authApi';
import type { User, Passenger, UserAccount, SessionContext } from '../types/domain';
import toast from 'react-hot-toast';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  passenger: Passenger | null;
  account: UserAccount | null;
  session: SessionContext | null;
  isAuthenticated: boolean;
  isPassenger: boolean;
  isAdmin: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  oauthGoogle: (token: string) => Promise<void>;
  oauthApple: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    passenger: null,
    account: null,
    session: null,
    isAuthenticated: false,
    isPassenger: false,
    isAdmin: false,
    loading: true,
  });

  /** Restore session from localStorage on mount */
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const raw   = localStorage.getItem('auth_user');
    if (token && raw) {
      try {
        const session: SessionContext = JSON.parse(raw);
        // Check expiry
        if (new Date(session.expiresAt) > new Date()) {
          setState(prev => ({
            ...prev,
            session,
            user: { userId: session.userId, userName: '', email: session.email, role: session.role },
            isAuthenticated: true,
            isPassenger: session.role === 'PASSENGER',
            isAdmin:    session.role === 'ADMIN',
            loading: true,
          }));
          // Hydrate full user data
          authApi.me()
            .then(res => {
              setState(prev => ({
                ...prev,
                user:      res.data.user,
                passenger: res.data.passenger ?? null,
                account:   res.data.account   ?? null,
                loading: false,
              }));
            })
            .catch(() => {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
              setState(prev => ({
                ...prev, user: null, passenger: null, account: null,
                session: null, isAuthenticated: false, isPassenger: false,
                isAdmin: false, loading: false,
              }));
            });
          return;
        }
      } catch {
        // Corrupted storage
      }
    }
    setState(prev => ({ ...prev, loading: false }));
  }, []);

  const applyAuthResponse = useCallback((data: {
    passenger?: Passenger;
    admin?: { adminId: number; name: string };
    user?: User;
    account?: UserAccount;
    session: SessionContext;
  }) => {
    const { session, user, passenger, account } = data;
    localStorage.setItem('auth_token', session.token);
    localStorage.setItem('auth_user', JSON.stringify(session));
    setState({
      user:      user ?? null,
      passenger: passenger ?? null,
      account:   account   ?? null,
      session,
      isAuthenticated: true,
      isPassenger: session.role === 'PASSENGER',
      isAdmin:    session.role === 'ADMIN',
      loading: false,
    });
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await authApi.login(payload);
    applyAuthResponse(res.data);
  }, [applyAuthResponse]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await authApi.register(payload);
    applyAuthResponse(res.data);
  }, [applyAuthResponse]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setState({
      user: null, passenger: null, account: null, session: null,
      isAuthenticated: false, isPassenger: false, isAdmin: false, loading: false,
    });
    toast.success('Logged out successfully');
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await authApi.me();
    setState(prev => ({
      ...prev,
      user:      res.data.user,
      passenger: res.data.passenger ?? null,
      account:   res.data.account   ?? null,
    }));
  }, []);

  const oauthGoogle = useCallback(async (token: string) => {
    const res = await authApi.oauthGoogle(token);
    applyAuthResponse(res.data);
  }, [applyAuthResponse]);

  const oauthApple = useCallback(async (token: string) => {
    const res = await authApi.oauthApple(token);
    applyAuthResponse(res.data);
  }, [applyAuthResponse]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser, oauthGoogle, oauthApple }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
