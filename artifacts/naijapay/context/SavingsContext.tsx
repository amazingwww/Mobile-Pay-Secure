import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

export type SavingsGoal = {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string;
  color: string;
  createdAt: string;
};

export const GOAL_COLORS = [
  '#2563EB', '#4F46E5', '#0284C7', '#D97706',
  '#DC2626', '#7C3AED', '#0891B2', '#059669',
];

export const GOAL_EMOJIS = ['🏠', '✈️', '🎓', '💍', '🚗', '📱', '💼', '🎯', '🏋️', '🌴', '🛍️', '💊'];

type SavingsContextType = {
  goals: SavingsGoal[];
  isLoading: boolean;
  createGoal: (params: { name: string; emoji: string; targetAmount: number; deadline?: string; color: string }) => void;
  deleteGoal: (id: string) => void;
  fundGoal: (id: string, amount: number, walletFund: (amount: number, name: string) => Promise<{ ok: boolean; error?: string }>) => Promise<{ ok: boolean; error?: string }>;
  withdrawGoal: (id: string, amount: number, walletCredit: (amount: number, name: string) => void) => void;
  totalSaved: number;
};

const SavingsContext = createContext<SavingsContextType | undefined>(undefined);

const STORAGE_KEY = '@guudees_savings_goals';

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 6);
}

const DEMO_GOALS: SavingsGoal[] = [
  {
    id: 'sg1',
    name: 'Emergency Fund',
    emoji: '🏦',
    targetAmount: 500000,
    savedAmount: 120000,
    color: '#2563EB',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'sg2',
    name: 'Holiday Trip',
    emoji: '✈️',
    targetAmount: 350000,
    savedAmount: 85000,
    deadline: new Date(Date.now() + 120 * 86400000).toISOString(),
    color: '#4F46E5',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

export function SavingsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<SavingsGoal[]>(DEMO_GOALS);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavingsGoal[];
        if (parsed.length > 0) setGoals(parsed);
      }
    } catch {}
    setIsLoading(false);
  };

  const save = useCallback(async (list: SavingsGoal[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }, []);

  useEffect(() => { load(); }, []);

  const createGoal = useCallback((params: { name: string; emoji: string; targetAmount: number; deadline?: string; color: string }) => {
    const goal: SavingsGoal = {
      id: genId(),
      name: params.name,
      emoji: params.emoji,
      targetAmount: params.targetAmount,
      savedAmount: 0,
      deadline: params.deadline,
      color: params.color,
      createdAt: new Date().toISOString(),
    };
    setGoals(prev => {
      const next = [goal, ...prev];
      save(next);
      return next;
    });
  }, [save]);

  const deleteGoal = useCallback((id: string) => {
    setGoals(prev => {
      const next = prev.filter(g => g.id !== id);
      save(next);
      return next;
    });
  }, [save]);

  const fundGoal = useCallback(async (
    id: string,
    amount: number,
    walletFund: (amount: number, name: string) => Promise<{ ok: boolean; error?: string }>
  ): Promise<{ ok: boolean; error?: string }> => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return { ok: false, error: 'Goal not found' };
    const result = await walletFund(amount, goal.name);
    if (!result.ok) return result;
    setGoals(prev => {
      const next = prev.map(g =>
        g.id === id ? { ...g, savedAmount: Math.min(g.savedAmount + amount, g.targetAmount) } : g
      );
      save(next);
      return next;
    });
    return { ok: true };
  }, [goals, save]);

  const withdrawGoal = useCallback((
    id: string,
    amount: number,
    walletCredit: (amount: number, name: string) => void
  ) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const withdrawable = Math.min(amount, goal.savedAmount);
    if (withdrawable <= 0) return;
    walletCredit(withdrawable, goal.name);
    setGoals(prev => {
      const next = prev.map(g =>
        g.id === id ? { ...g, savedAmount: Math.max(0, g.savedAmount - withdrawable) } : g
      );
      save(next);
      return next;
    });
  }, [goals, save]);

  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);

  return (
    <SavingsContext.Provider value={{ goals, isLoading, createGoal, deleteGoal, fundGoal, withdrawGoal, totalSaved }}>
      {children}
    </SavingsContext.Provider>
  );
}

export const useSavings = () => {
  const ctx = useContext(SavingsContext);
  if (!ctx) throw new Error('useSavings must be used within SavingsProvider');
  return ctx;
};
