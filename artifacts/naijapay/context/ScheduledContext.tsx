import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useWallet } from '@/context/WalletContext';

export type ScheduleFrequency = 'weekly' | 'monthly';

export type ScheduledPayment = {
  id: string;
  name: string;
  recipientName: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  amount: number;
  narration: string;
  frequency: ScheduleFrequency;
  nextRunDate: string;
  lastRunDate?: string;
  status: 'active' | 'paused';
  createdAt: string;
  runCount: number;
};

type ScheduledContextType = {
  payments: ScheduledPayment[];
  isLoading: boolean;
  createPayment: (params: Omit<ScheduledPayment, 'id' | 'createdAt' | 'runCount' | 'status' | 'lastRunDate'>) => void;
  deletePayment: (id: string) => void;
  pausePayment: (id: string) => void;
  resumePayment: (id: string) => void;
  runNow: (id: string) => Promise<{ ok: boolean; error?: string }>;
  executedToday: string[];
};

const ScheduledContext = createContext<ScheduledContextType | undefined>(undefined);

const STORAGE_KEY = '@guudees_scheduled_payments';

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 6);
}

function nextDate(from: Date, freq: ScheduleFrequency): string {
  const d = new Date(from);
  if (freq === 'weekly') d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

const DEMO_PAYMENTS: ScheduledPayment[] = [
  {
    id: 'sp1',
    name: 'Monthly Rent',
    recipientName: 'Alhaji Musa Ibrahim',
    accountNumber: '3344556677',
    bankCode: '033',
    bankName: 'UBA',
    amount: 85000,
    narration: 'Monthly rent payment',
    frequency: 'monthly',
    nextRunDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
    status: 'active',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    runCount: 2,
  },
  {
    id: 'sp2',
    name: 'Weekly Savings',
    recipientName: 'Ngozi Cooperative',
    accountNumber: '7788990011',
    bankCode: '044',
    bankName: 'Access Bank',
    amount: 10000,
    narration: 'Weekly cooperative savings',
    frequency: 'weekly',
    nextRunDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
      return d.toISOString();
    })(),
    status: 'active',
    createdAt: new Date(Date.now() - 21 * 86400000).toISOString(),
    runCount: 3,
  },
];

export function ScheduledProvider({ children }: { children: ReactNode }) {
  const { sendMoney } = useWallet();
  const [payments, setPayments] = useState<ScheduledPayment[]>(DEMO_PAYMENTS);
  const [isLoading, setIsLoading] = useState(true);
  const [executedToday, setExecutedToday] = useState<string[]>([]);

  const save = useCallback(async (list: ScheduledPayment[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }, []);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ScheduledPayment[];
        if (parsed.length > 0) setPayments(parsed);
      }
    } catch {}
    setIsLoading(false);
  };

  // Check for due payments and auto-execute
  const checkDue = useCallback(async (list: ScheduledPayment[]) => {
    const now = new Date();
    const executed: string[] = [];
    let updated = [...list];

    for (const p of list) {
      if (p.status !== 'active') continue;
      const due = new Date(p.nextRunDate);
      if (due <= now) {
        const result = await sendMoney({
          accountNumber: p.accountNumber,
          bankCode: p.bankCode,
          bankName: p.bankName,
          amount: p.amount,
          narration: `[Scheduled] ${p.narration}`,
          recipientName: p.recipientName,
        });
        if (result.ok) {
          executed.push(p.id);
          updated = updated.map(x =>
            x.id === p.id
              ? {
                  ...x,
                  runCount: x.runCount + 1,
                  lastRunDate: now.toISOString(),
                  nextRunDate: nextDate(now, x.frequency),
                }
              : x
          );
        }
      }
    }

    if (executed.length > 0) {
      setPayments(updated);
      save(updated);
      setExecutedToday(executed);
    }
  }, [sendMoney, save]);

  useEffect(() => {
    load().then(() => {
      setPayments(prev => {
        checkDue(prev);
        return prev;
      });
    });
  }, []);

  const createPayment = useCallback((params: Omit<ScheduledPayment, 'id' | 'createdAt' | 'runCount' | 'status' | 'lastRunDate'>) => {
    const p: ScheduledPayment = {
      ...params,
      id: genId(),
      createdAt: new Date().toISOString(),
      runCount: 0,
      status: 'active',
    };
    setPayments(prev => {
      const next = [p, ...prev];
      save(next);
      return next;
    });
  }, [save]);

  const deletePayment = useCallback((id: string) => {
    setPayments(prev => {
      const next = prev.filter(p => p.id !== id);
      save(next);
      return next;
    });
  }, [save]);

  const pausePayment = useCallback((id: string) => {
    setPayments(prev => {
      const next = prev.map(p => p.id === id ? { ...p, status: 'paused' as const } : p);
      save(next);
      return next;
    });
  }, [save]);

  const resumePayment = useCallback((id: string) => {
    setPayments(prev => {
      const next = prev.map(p => p.id === id ? { ...p, status: 'active' as const } : p);
      save(next);
      return next;
    });
  }, [save]);

  const runNow = useCallback(async (id: string): Promise<{ ok: boolean; error?: string }> => {
    const p = payments.find(x => x.id === id);
    if (!p) return { ok: false, error: 'Payment not found' };
    const result = await sendMoney({
      accountNumber: p.accountNumber,
      bankCode: p.bankCode,
      bankName: p.bankName,
      amount: p.amount,
      narration: `[Scheduled] ${p.narration}`,
      recipientName: p.recipientName,
    });
    if (result.ok) {
      const now = new Date();
      setPayments(prev => {
        const next = prev.map(x =>
          x.id === id
            ? { ...x, runCount: x.runCount + 1, lastRunDate: now.toISOString(), nextRunDate: nextDate(now, x.frequency) }
            : x
        );
        save(next);
        return next;
      });
    }
    return result;
  }, [payments, sendMoney, save]);

  return (
    <ScheduledContext.Provider value={{ payments, isLoading, createPayment, deletePayment, pausePayment, resumePayment, runNow, executedToday }}>
      {children}
    </ScheduledContext.Provider>
  );
}

export const useScheduled = () => {
  const ctx = useContext(ScheduledContext);
  if (!ctx) throw new Error('useScheduled must be used within ScheduledProvider');
  return ctx;
};
