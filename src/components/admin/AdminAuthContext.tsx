import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AdminUser } from '../../lib/api';

interface AdminAuthState {
  token: string | null;
  user: AdminUser | null;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthState>({
  token: null,
  user: null,
  login: () => {},
  logout: () => {},
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('admin_token'));
  const [user, setUser] = useState<AdminUser | null>(() => {
    const raw = sessionStorage.getItem('admin_user');
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  });

  const login = useCallback((t: string, u: AdminUser) => {
    sessionStorage.setItem('admin_token', t);
    sessionStorage.setItem('admin_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
