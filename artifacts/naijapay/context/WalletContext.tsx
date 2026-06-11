import React, { createContext, useContext, useState, ReactNode } from 'react';

export type TxCategory = 'transfer' | 'airtime' | 'data' | 'bill' | 'deposit';

export type Transaction = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  party: string;
  date: string;
  status: 'success' | 'pending' | 'failed';
  category: TxCategory;
  reference: string;
};

export type Beneficiary = {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
};

type WalletContextType = {
  balance: number;
  transactions: Transaction[];
  beneficiaries: Beneficiary[];
  sendMoney: (amount: number, party: string, narration: string) => Promise<boolean>;
  buyAirtime: (phone: string, network: string, amount: number) => Promise<boolean>;
  buyData: (phone: string, network: string, plan: string, amount: number) => Promise<boolean>;
  payBill: (type: string, reference: string, amount: number) => Promise<boolean>;
  addBeneficiary: (b: Omit<Beneficiary, 'id'>) => void;
};

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 6);
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'credit',
    amount: 250000,
    description: 'Salary - June 2025',
    party: 'XYZ Technologies Ltd',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'success',
    category: 'deposit',
    reference: 'NP20250610001',
  },
  {
    id: '2',
    type: 'debit',
    amount: 5000,
    description: 'MTN Airtime Recharge',
    party: 'MTN Nigeria',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'success',
    category: 'airtime',
    reference: 'NP20250609001',
  },
  {
    id: '3',
    type: 'debit',
    amount: 25000,
    description: 'Transfer to Chukwuemeka Nwosu',
    party: 'Chukwuemeka Nwosu',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'success',
    category: 'transfer',
    reference: 'NP20250608001',
  },
  {
    id: '4',
    type: 'debit',
    amount: 14500,
    description: 'PHCN Electricity',
    party: 'Ikeja Electric',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'success',
    category: 'bill',
    reference: 'NP20250606001',
  },
  {
    id: '5',
    type: 'credit',
    amount: 50000,
    description: 'Transfer from Fatimah Abubakar',
    party: 'Fatimah Abubakar',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'success',
    category: 'transfer',
    reference: 'NP20250604001',
  },
  {
    id: '6',
    type: 'debit',
    amount: 9900,
    description: 'DSTV Subscription - Compact',
    party: 'DSTV Nigeria',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'success',
    category: 'bill',
    reference: 'NP20250601001',
  },
  {
    id: '7',
    type: 'debit',
    amount: 1200,
    description: 'Airtel Data - 1GB',
    party: 'Airtel Nigeria',
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'success',
    category: 'data',
    reference: 'NP20250530001',
  },
  {
    id: '8',
    type: 'credit',
    amount: 10000,
    description: 'Transfer from Olumide Badmus',
    party: 'Olumide Badmus',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'success',
    category: 'transfer',
    reference: 'NP20250527001',
  },
];

const INITIAL_BENEFICIARIES: Beneficiary[] = [
  {
    id: '1',
    name: 'Chukwuemeka Nwosu',
    accountNumber: '0987654321',
    bankName: 'Access Bank',
    bankCode: '044',
  },
  {
    id: '2',
    name: 'Fatimah Abubakar',
    accountNumber: '1122334455',
    bankName: 'Zenith Bank',
    bankCode: '057',
  },
  {
    id: '3',
    name: 'Olumide Badmus',
    accountNumber: '2233445566',
    bankName: 'GTBank',
    bankCode: '058',
  },
];

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(245600.5);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(INITIAL_BENEFICIARIES);

  const sendMoney = async (amount: number, party: string, narration: string): Promise<boolean> => {
    if (amount > balance) return false;
    const tx: Transaction = {
      id: genId(),
      type: 'debit',
      amount,
      description: narration || `Transfer to ${party}`,
      party,
      date: new Date().toISOString(),
      status: 'success',
      category: 'transfer',
      reference: 'NP' + genId().toUpperCase(),
    };
    setBalance(b => b - amount);
    setTransactions(t => [tx, ...t]);
    return true;
  };

  const buyAirtime = async (phone: string, network: string, amount: number): Promise<boolean> => {
    if (amount > balance) return false;
    const tx: Transaction = {
      id: genId(),
      type: 'debit',
      amount,
      description: `${network} Airtime - ${phone}`,
      party: `${network} Nigeria`,
      date: new Date().toISOString(),
      status: 'success',
      category: 'airtime',
      reference: 'NP' + genId().toUpperCase(),
    };
    setBalance(b => b - amount);
    setTransactions(t => [tx, ...t]);
    return true;
  };

  const buyData = async (phone: string, network: string, plan: string, amount: number): Promise<boolean> => {
    if (amount > balance) return false;
    const tx: Transaction = {
      id: genId(),
      type: 'debit',
      amount,
      description: `${network} Data - ${plan}`,
      party: `${network} Nigeria`,
      date: new Date().toISOString(),
      status: 'success',
      category: 'data',
      reference: 'NP' + genId().toUpperCase(),
    };
    setBalance(b => b - amount);
    setTransactions(t => [tx, ...t]);
    return true;
  };

  const payBill = async (type: string, reference: string, amount: number): Promise<boolean> => {
    if (amount > balance) return false;
    const tx: Transaction = {
      id: genId(),
      type: 'debit',
      amount,
      description: `${type} - Ref: ${reference}`,
      party: type,
      date: new Date().toISOString(),
      status: 'success',
      category: 'bill',
      reference: 'NP' + genId().toUpperCase(),
    };
    setBalance(b => b - amount);
    setTransactions(t => [tx, ...t]);
    return true;
  };

  const addBeneficiary = (b: Omit<Beneficiary, 'id'>) => {
    setBeneficiaries(prev => [{ ...b, id: genId() }, ...prev]);
  };

  return (
    <WalletContext.Provider
      value={{ balance, transactions, beneficiaries, sendMoney, buyAirtime, buyData, payBill, addBeneficiary }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
};
