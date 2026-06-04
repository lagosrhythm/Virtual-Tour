import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface AdminAuthState {
  passcode: string | null;
  isAuthenticated: boolean;
  login: (passcode: string) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthState>({
  passcode: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  // Initialize passcode from session storage
  const [passcode, setPasscode] = useState<string | null>(() => {
    const stored = sessionStorage.getItem('admin_passcode');
    // Debug: log what we're reading from session storage
    // console.debug('AdminAuthProvider: Reading passcode from session storage:', stored ? '[SET]' : '[NULL]');
    return stored;
  });

  const login = useCallback((p: string) => {
    sessionStorage.setItem('admin_passcode', p);
    setPasscode(p);
    // Debug: log login event
    // console.debug('AdminAuthProvider: Login successful, passcode stored in session storage');
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('admin_passcode');
    setPasscode(null);
    // Debug: log logout event
    // console.debug('AdminAuthProvider: Logout successful, passcode removed from session storage');
  }, []);

  return (
    <AdminAuthContext.Provider value={{ passcode, isAuthenticated: !!passcode, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
