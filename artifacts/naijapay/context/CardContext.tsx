import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CardStatus = 'active' | 'frozen' | 'blocked';
export type PhysicalStatus = 'not_requested' | 'processing' | 'in_transit' | 'delivered';

export type CardData = {
  id: string;
  kind: 'virtual' | 'physical';
  maskedPan: string;
  last4: string;
  expiry: string;
  cvv: string;
  status: CardStatus;
  dailyLimit: number;
  monthlyLimit: number;
  physicalStatus?: PhysicalStatus;
  deliveryAddress?: string;
  estimatedDelivery?: string;
};

type CardContextType = {
  virtual: CardData;
  physical: CardData;
  toggleFreeze: (kind: 'virtual' | 'physical') => void;
  blockCard: (kind: 'virtual' | 'physical') => void;
  requestPhysical: (address: string) => void;
  updateLimit: (kind: 'virtual' | 'physical', field: 'dailyLimit' | 'monthlyLimit', value: number) => void;
};

const STORAGE_KEY = '@guudees_cards';

const INITIAL_VIRTUAL: CardData = {
  id: 'v-001',
  kind: 'virtual',
  maskedPan: '4521 •••• •••• 7893',
  last4: '7893',
  expiry: '09/28',
  cvv: '742',
  status: 'active',
  dailyLimit: 500000,
  monthlyLimit: 5000000,
};

const INITIAL_PHYSICAL: CardData = {
  id: 'p-001',
  kind: 'physical',
  maskedPan: '5389 •••• •••• 2147',
  last4: '2147',
  expiry: '11/28',
  cvv: '391',
  status: 'active',
  dailyLimit: 1000000,
  monthlyLimit: 10000000,
  physicalStatus: 'not_requested',
};

const CardContext = createContext<CardContextType | undefined>(undefined);

export function CardProvider({ children }: { children: ReactNode }) {
  const [virtual, setVirtual] = useState<CardData>(INITIAL_VIRTUAL);
  const [physical, setPhysical] = useState<CardData>(INITIAL_PHYSICAL);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (saved.virtual) setVirtual(v => ({ ...v, ...saved.virtual }));
        if (saved.physical) setPhysical(p => ({ ...p, ...saved.physical }));
      } catch {}
    });
  }, []);

  function persist(v: CardData, p: CardData) {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ virtual: v, physical: p }));
  }

  function toggleFreeze(kind: 'virtual' | 'physical') {
    if (kind === 'virtual') {
      setVirtual(c => {
        const next = { ...c, status: (c.status === 'frozen' ? 'active' : 'frozen') as CardStatus };
        persist(next, physical);
        return next;
      });
    } else {
      setPhysical(c => {
        const next = { ...c, status: (c.status === 'frozen' ? 'active' : 'frozen') as CardStatus };
        persist(virtual, next);
        return next;
      });
    }
  }

  function blockCard(kind: 'virtual' | 'physical') {
    if (kind === 'virtual') {
      setVirtual(c => {
        const next = { ...c, status: 'blocked' as CardStatus };
        persist(next, physical);
        return next;
      });
    } else {
      setPhysical(c => {
        const next = { ...c, status: 'blocked' as CardStatus };
        persist(virtual, next);
        return next;
      });
    }
  }

  function requestPhysical(address: string) {
    const est = new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    setPhysical(c => {
      const next = { ...c, physicalStatus: 'processing' as PhysicalStatus, deliveryAddress: address, estimatedDelivery: est };
      persist(virtual, next);
      return next;
    });
  }

  function updateLimit(kind: 'virtual' | 'physical', field: 'dailyLimit' | 'monthlyLimit', value: number) {
    if (kind === 'virtual') {
      setVirtual(c => {
        const next = { ...c, [field]: value };
        persist(next, physical);
        return next;
      });
    } else {
      setPhysical(c => {
        const next = { ...c, [field]: value };
        persist(virtual, next);
        return next;
      });
    }
  }

  return (
    <CardContext.Provider value={{ virtual, physical, toggleFreeze, blockCard, requestPhysical, updateLimit }}>
      {children}
    </CardContext.Provider>
  );
}

export function useCards() {
  const ctx = useContext(CardContext);
  if (!ctx) throw new Error('useCards must be inside CardProvider');
  return ctx;
}
