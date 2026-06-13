import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, type ApiTransaction } from '@/lib/api';
import {
  notifyTransferSent,
  notifyAirtimeSent,
  notifyDataPurchased,
  notifyBillPaid,
} from '@/lib/notifications';

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
  isLoading: boolean;
  isTxLoading: boolean;
  apiReady: boolean;
  refresh: () => Promise<void>;
  sendMoney: (params: {
    accountNumber: string;
    bankCode: string;
    bankName: string;
    amount: number;
    narration: string;
    recipientName?: string;
  }) => Promise<{ ok: boolean; reference?: string; error?: string }>;
  buyAirtime: (phone: string, network: string, amount: number) => Promise<boolean>;
  buyData: (phone: string, network: string, planCode: string, amount: number) => Promise<boolean>;
  payBill: (type: string, reference: string, amount: number, extra?: Record<string, string>) => Promise<{ ok: boolean; token?: string; error?: string }>;
  addBeneficiary: (b: Omit<Beneficiary, 'id'>) => void;
  verifyAccount: (accountNumber: string, bankCode: string) => Promise<string>;
  fundGoalTransfer: (amount: number, goalName: string) => Promise<{ ok: boolean; error?: string }>;
  creditBalance: (amount: number, goalName: string) => void;
};

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 6);
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'credit', amount: 250000, description: 'Salary - June 2026', party: 'XYZ Technologies Ltd', date: new Date(Date.now() - 1 * 86400000).toISOString(), status: 'success', category: 'deposit', reference: 'GD20260610001' },
  { id: '2', type: 'debit', amount: 5000, description: 'MTN Airtime Recharge', party: 'MTN Nigeria', date: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'success', category: 'airtime', reference: 'GD20260609001' },
  { id: '3', type: 'debit', amount: 25000, description: 'Transfer to Chukwuemeka Nwosu', party: 'Chukwuemeka Nwosu', date: new Date(Date.now() - 3 * 86400000).toISOString(), status: 'success', category: 'transfer', reference: 'GD20260608001' },
  { id: '4', type: 'debit', amount: 14500, description: 'PHCN Electricity', party: 'Ikeja Electric', date: new Date(Date.now() - 5 * 86400000).toISOString(), status: 'success', category: 'bill', reference: 'GD20260606001' },
  { id: '5', type: 'credit', amount: 50000, description: 'Transfer from Fatimah Abubakar', party: 'Fatimah Abubakar', date: new Date(Date.now() - 7 * 86400000).toISOString(), status: 'success', category: 'transfer', reference: 'GD20260604001' },
  { id: '6', type: 'debit', amount: 9900, description: 'DSTV Subscription - Compact', party: 'DSTV Nigeria', date: new Date(Date.now() - 10 * 86400000).toISOString(), status: 'success', category: 'bill', reference: 'GD20260601001' },
  { id: '7', type: 'debit', amount: 1200, description: 'Airtel Data - 1GB', party: 'Airtel Nigeria', date: new Date(Date.now() - 12 * 86400000).toISOString(), status: 'success', category: 'data', reference: 'GD20260530001' },
  { id: '8', type: 'credit', amount: 10000, description: 'Transfer from Olumide Badmus', party: 'Olumide Badmus', date: new Date(Date.now() - 15 * 86400000).toISOString(), status: 'success', category: 'transfer', reference: 'GD20260527001' },
];

const INITIAL_BENEFICIARIES: Beneficiary[] = [
  { id: '1', name: 'Chukwuemeka Nwosu', accountNumber: '0987654321', bankName: 'Access Bank', bankCode: '044' },
  { id: '2', name: 'Fatimah Abubakar', accountNumber: '1122334455', bankName: 'Zenith Bank', bankCode: '057' },
  { id: '3', name: 'Olumide Badmus', accountNumber: '2233445566', bankName: 'GTBank', bankCode: '058' },
];

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(245600.5);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(INITIAL_BENEFICIARIES);
  const [isLoading, setIsLoading] = useState(false);
  const [isTxLoading, setIsTxLoading] = useState(false);
  const [apiReady, setApiReady] = useState(false);

  const loadBeneficiaries = async () => {
    try {
      const stored = await AsyncStorage.getItem('@guudees_beneficiaries');
      if (stored) setBeneficiaries(JSON.parse(stored));
    } catch {}
  };

  const saveBeneficiaries = async (list: Beneficiary[]) => {
    try {
      await AsyncStorage.setItem('@guudees_beneficiaries', JSON.stringify(list));
    } catch {}
  };

  const fetchBalance = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getBalance();
      setBalance(data.balance);
      setApiReady(true);
    } catch {
      setApiReady(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsTxLoading(true);
      const data = await api.getTransactions(1, 50);
      if (data.transactions.length > 0) {
        setTransactions(data.transactions as Transaction[]);
      }
    } catch {
    } finally {
      setIsTxLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchBalance(), fetchTransactions()]);
  }, [fetchBalance, fetchTransactions]);

  useEffect(() => {
    loadBeneficiaries();
    refresh();
  }, []);

  const verifyAccount = async (accountNumber: string, bankCode: string): Promise<string> => {
    if (!apiReady) {
      const FAKE: Record<string, string> = {
        '0987654321': 'CHUKWUEMEKA NWOSU',
        '1122334455': 'FATIMAH ABUBAKAR',
        '2233445566': 'OLUMIDE BADMUS',
      };
      if (FAKE[accountNumber]) return FAKE[accountNumber];
      if (accountNumber.length === 10) {
        const names = ['EMEKA JOHNSON', 'BLESSING OKAFOR', 'IBRAHIM MUSA', 'CHIOMA EZE', 'TUNDE ADEYEMI'];
        return names[parseInt(accountNumber.slice(-1)) % names.length];
      }
      return '';
    }
    const data = await api.verifyAccount(accountNumber, bankCode);
    return data.accountName;
  };

  const addTx = (tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
  };

  const sendMoney = async (params: {
    accountNumber: string;
    bankCode: string;
    bankName: string;
    amount: number;
    narration: string;
    recipientName?: string;
  }): Promise<{ ok: boolean; reference?: string; error?: string }> => {
    const displayName = params.recipientName || params.accountNumber;

    if (!apiReady) {
      if (params.amount > balance) return { ok: false, error: 'Insufficient balance' };
      setBalance(b => b - params.amount);
      const ref = 'GD' + genId().toUpperCase();
      const tx: Transaction = {
        id: genId(), type: 'debit', amount: params.amount,
        description: params.narration || `Transfer to ${displayName}`,
        party: displayName, date: new Date().toISOString(),
        status: 'success', category: 'transfer', reference: ref,
      };
      addTx(tx);
      notifyTransferSent(params.amount, displayName, ref);
      return { ok: true, reference: ref };
    }
    try {
      const data = await api.sendMoney({
        accountNumber: params.accountNumber,
        bankCode: params.bankCode,
        amount: params.amount,
        narration: params.narration,
      });
      setBalance(b => b - params.amount);
      notifyTransferSent(params.amount, displayName, data.reference);
      return { ok: true, reference: data.reference };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? 'Transfer failed' };
    }
  };

  const buyAirtime = async (phone: string, network: string, amount: number): Promise<boolean> => {
    if (!apiReady) {
      if (amount > balance) return false;
      setBalance(b => b - amount);
      addTx({ id: genId(), type: 'debit', amount, description: `${network} Airtime - ${phone}`, party: `${network} Nigeria`, date: new Date().toISOString(), status: 'success', category: 'airtime', reference: 'GD' + genId().toUpperCase() });
      notifyAirtimeSent(amount, phone, network);
      return true;
    }
    try {
      await api.buyAirtime({ network, phone, amount });
      setBalance(b => b - amount);
      addTx({ id: genId(), type: 'debit', amount, description: `${network} Airtime - ${phone}`, party: `${network} Nigeria`, date: new Date().toISOString(), status: 'success', category: 'airtime', reference: 'GD' + genId().toUpperCase() });
      notifyAirtimeSent(amount, phone, network);
      return true;
    } catch { return false; }
  };

  const buyData = async (phone: string, network: string, planCode: string, amount: number): Promise<boolean> => {
    if (!apiReady) {
      if (amount > balance) return false;
      setBalance(b => b - amount);
      addTx({ id: genId(), type: 'debit', amount, description: `${network} Data - ${planCode}`, party: `${network} Nigeria`, date: new Date().toISOString(), status: 'success', category: 'data', reference: 'GD' + genId().toUpperCase() });
      notifyDataPurchased(planCode, phone, network);
      return true;
    }
    try {
      await api.buyData({ network, phone, planCode, amount });
      setBalance(b => b - amount);
      addTx({ id: genId(), type: 'debit', amount, description: `${network} Data - ${planCode}`, party: `${network} Nigeria`, date: new Date().toISOString(), status: 'success', category: 'data', reference: 'GD' + genId().toUpperCase() });
      notifyDataPurchased(planCode, phone, network);
      return true;
    } catch { return false; }
  };

  const payBill = async (type: string, reference: string, amount: number, extra?: Record<string, string>): Promise<{ ok: boolean; token?: string; error?: string }> => {
    if (!apiReady) {
      if (amount > balance) return { ok: false, error: 'Insufficient balance' };
      setBalance(b => b - amount);
      addTx({ id: genId(), type: 'debit', amount, description: `${type} - Ref: ${reference}`, party: type, date: new Date().toISOString(), status: 'success', category: 'bill', reference: 'GD' + genId().toUpperCase() });
      notifyBillPaid(type, amount);
      return { ok: true };
    }
    try {
      let result: { reference: string; token?: string } = { reference: '' };
      if (type === 'electricity' && extra) {
        result = await api.payElectricity({ disco: extra.disco, meterNumber: reference, meterType: extra.meterType, amount });
      } else if (type === 'cable' && extra) {
        result = await api.payCable({ provider: extra.provider, smartCardNumber: reference, packageCode: extra.packageCode, amount });
      }
      setBalance(b => b - amount);
      addTx({ id: genId(), type: 'debit', amount, description: `${type} - Ref: ${reference}`, party: type, date: new Date().toISOString(), status: 'success', category: 'bill', reference: result.reference });
      notifyBillPaid(type, amount, result.token);
      return { ok: true, token: result.token };
    } catch (e: any) {
      return { ok: false, error: e?.message };
    }
  };

  const addBeneficiary = (b: Omit<Beneficiary, 'id'>) => {
    const updated = [{ ...b, id: genId() }, ...beneficiaries];
    setBeneficiaries(updated);
    saveBeneficiaries(updated);
  };

  const fundGoalTransfer = async (amount: number, goalName: string): Promise<{ ok: boolean; error?: string }> => {
    if (amount > balance) return { ok: false, error: 'Insufficient balance' };
    setBalance(b => b - amount);
    addTx({
      id: genId(), type: 'debit', amount,
      description: `Savings: ${goalName}`,
      party: 'Guudees Savings',
      date: new Date().toISOString(),
      status: 'success', category: 'transfer',
      reference: 'GD' + genId().toUpperCase(),
    });
    return { ok: true };
  };

  const creditBalance = (amount: number, goalName: string) => {
    setBalance(b => b + amount);
    addTx({
      id: genId(), type: 'credit', amount,
      description: `Withdrawal: ${goalName}`,
      party: 'Guudees Savings',
      date: new Date().toISOString(),
      status: 'success', category: 'deposit',
      reference: 'GD' + genId().toUpperCase(),
    });
  };

  return (
    <WalletContext.Provider value={{ balance, transactions, beneficiaries, isLoading, isTxLoading, apiReady, refresh, sendMoney, buyAirtime, buyData, payBill, addBeneficiary, verifyAccount, fundGoalTransfer, creditBalance }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
};
