import { createContext, useContext, useState, ReactNode } from 'react';
import type { Staff } from '../types';
import { loginWithPin as firebaseLoginWithPin } from '../lib/firebase/staff';

interface AuthContextType {
  staff: Staff | null;
  loginWithPin: (pin: string) => Promise<Staff | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff | null>(null);

  const loginWithPin = async (pin: string): Promise<Staff | null> => {
    const foundStaff = await firebaseLoginWithPin(pin);
    if (foundStaff) {
      setStaff(foundStaff);
      return foundStaff;
    }
    return null;
  };

  const logout = () => {
    setStaff(null);
  };

  return (
    <AuthContext.Provider
      value={{
        staff,
        loginWithPin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
