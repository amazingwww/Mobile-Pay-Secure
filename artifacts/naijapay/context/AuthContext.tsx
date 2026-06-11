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
  bankName: 'Zela Microfinance Bank',
  phone: '+234 801 234 5678',
  email: 'adebayo@zela.ng',
  bvn: '22*******12',
  pin: '1234',
  tier: 'Tier 2',
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
      const stored = await AsyncStorage.getItem('@zela_user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        await AsyncStorage.setItem('@zela_user', JSON.stringify(DEFAULT_USER));
        setUser(DEFAULT_USER);
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
    await AsyncStorage.setItem('@zela_user', JSON.stringify(updated));
    setUser(updated);
    return true;
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    await AsyncStorage.setItem('@zela_user', JSON.stringify(updated));
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
