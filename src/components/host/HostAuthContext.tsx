import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { HostData } from '../../lib/api';

interface HostAuthState {
  passcode: string | null;
  host: HostData | null;
  isAuthenticated: boolean;
  login: (passcode: string, host: HostData) => void;
  logout: () => void;
}

const HostAuthContext = createContext<HostAuthState>({
  passcode: null,
  host: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export function HostAuthProvider({ children }: { children: ReactNode }) {
  const [passcode, setPasscode] = useState<string | null>(() => {
    const stored = sessionStorage.getItem('host_passcode');
    return stored;
  });

  const [host, setHost] = useState<HostData | null>(() => {
    const stored = sessionStorage.getItem('host_data');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((p: string, h: HostData) => {
    sessionStorage.setItem('host_passcode', p);
    sessionStorage.setItem('host_data', JSON.stringify(h));
    setPasscode(p);
    setHost(h);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('host_passcode');
    sessionStorage.removeItem('host_data');
    setPasscode(null);
    setHost(null);
  }, []);

  return (
    <HostAuthContext.Provider value={{ passcode, host, isAuthenticated: !!passcode && !!host, login, logout }}>
      {children}
    </HostAuthContext.Provider>
  );
}

export function useHostAuth() {
  return useContext(HostAuthContext);
}
