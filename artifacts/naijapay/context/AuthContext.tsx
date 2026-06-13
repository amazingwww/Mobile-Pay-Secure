import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type User = {
  name: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  phone: string;
  email: string;
  bvn: string;
  pin: string;
  tier: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  updatePin: (oldPin: string, newPin: string) => Promise<boolean>;
  updateUser: (updates: Partial<User>) => Promise<void>;
};

const DEFAULT_USER: User = {
  name: 'Adebayo Okonkwo',
  accountNumber: '0123456789',
  accountName: 'ADEBAYO OKONKWO',
  bankName: 'Guudees MFB',
  phone: '+234 801 234 5678',
  email: 'adebayo@guudees.ng',
  bvn: '22*******12',
  pin: '1234',
  tier: 'Tier 1',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initUser();
  }, []);

  const initUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('@guudees_user');
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        // Migrate old bank name if needed
        if (parsed.bankName === 'Zela Microfinance Bank') {
          parsed.bankName = 'Guudees MFB';
        }
        setUser(parsed);
      } else {
        // Try legacy key
        const legacy = await AsyncStorage.getItem('@zela_user');
        if (legacy) {
          const parsed = JSON.parse(legacy) as User;
          parsed.bankName = 'Guudees MFB';
          await AsyncStorage.setItem('@guudees_user', JSON.stringify(parsed));
          setUser(parsed);
        } else {
          await AsyncStorage.setItem('@guudees_user', JSON.stringify(DEFAULT_USER));
          setUser(DEFAULT_USER);
        }
      }
    } catch {
      setUser(DEFAULT_USER);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (pin: string): Promise<boolean> => {
    if (!user) return false;
    if (pin === user.pin) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => setIsAuthenticated(false);

  const updatePin = async (oldPin: string, newPin: string): Promise<boolean> => {
    if (!user || oldPin !== user.pin) return false;
    const updated = { ...user, pin: newPin };
    await AsyncStorage.setItem('@guudees_user', JSON.stringify(updated));
    setUser(updated);
    return true;
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    await AsyncStorage.setItem('@guudees_user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, updatePin, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
