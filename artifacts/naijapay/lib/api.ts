const BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/zela`;

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message ?? `API error ${res.status}`);
  }
  return data as T;
}

export const api = {
  // Account
  getBalance: () => req<{ balance: number; accountNumber: string; accountName: string }>('/account/balance'),
  getTransactions: (page = 1, limit = 20) =>
    req<{ transactions: ApiTransaction[]; total: number }>(`/account/transactions?page=${page}&limit=${limit}`),

  // Name enquiry
  verifyAccount: (accountNumber: string, bankCode: string) =>
    req<{ accountName: string; accountNumber: string }>('/transfer/verify', {
      method: 'POST',
      body: JSON.stringify({ accountNumber, bankCode }),
    }),

  // NIP transfer
  sendMoney: (payload: {
    accountNumber: string;
    bankCode: string;
    amount: number;
    narration: string;
    saveBeneficiary?: boolean;
  }) =>
    req<{ reference: string; status: string }>('/transfer/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Bills
  buyAirtime: (payload: { network: string; phone: string; amount: number }) =>
    req<{ reference: string }>('/bills/airtime', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  buyData: (payload: { network: string; phone: string; planCode: string; amount: number }) =>
    req<{ reference: string }>('/bills/data', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  payElectricity: (payload: { disco: string; meterNumber: string; meterType: string; amount: number }) =>
    req<{ reference: string; token?: string }>('/bills/electricity', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  payCable: (payload: { provider: string; smartCardNumber: string; packageCode: string; amount: number }) =>
    req<{ reference: string }>('/bills/cable', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Banks list
  getBanks: () => req<{ banks: { name: string; code: string; logo?: string }[] }>('/banks'),
};

export type ApiTransaction = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  party: string;
  date: string;
  status: 'success' | 'pending' | 'failed';
  category: 'transfer' | 'airtime' | 'data' | 'bill' | 'deposit';
  reference: string;
};
