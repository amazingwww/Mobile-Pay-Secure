import { Router } from "express";
import { isConfigured, shGet, shPost } from "../lib/safehaven";
import { logger } from "../lib/logger";

const router = Router();

function notConfigured(res: any) {
  res.status(503).json({ message: "Safe Haven credentials not configured. Add SAFE_HAVEN_CLIENT_ID, SAFE_HAVEN_CLIENT_SECRET, and SAFE_HAVEN_IBS_CLIENT_ID to your secrets." });
}

// GET /api/zela/account/balance
router.get("/account/balance", async (req, res) => {
  if (!isConfigured()) return notConfigured(res);
  try {
    const r = await shGet("/finance/account");
    const data = await r.json() as any;
    if (!r.ok) {
      req.log.error({ status: r.status, data }, "balance fetch error");
      return res.status(r.status).json({ message: data?.message ?? "Failed to fetch balance" });
    }
    const acct = data?.data ?? data;
    res.json({
      balance: acct.availableBalance ?? acct.balance ?? 0,
      accountNumber: acct.accountNumber ?? "",
      accountName: acct.accountName ?? "",
    });
  } catch (err) {
    req.log.error({ err }, "balance error");
    res.status(500).json({ message: "Internal error" });
  }
});

// GET /api/zela/account/transactions
router.get("/account/transactions", async (req, res) => {
  if (!isConfigured()) return notConfigured(res);
  try {
    const { page = "1", limit = "20" } = req.query as Record<string, string>;
    const r = await shGet(`/finance/transaction?page=${page}&limit=${limit}`);
    const data = await r.json() as any;
    if (!r.ok) return res.status(r.status).json({ message: data?.message ?? "Failed" });

    const rawTxns = data?.data?.transactions ?? data?.data ?? [];
    const transactions = rawTxns.map((t: any) => ({
      id: t._id ?? t.id,
      type: t.type === "credit" || t.creditAmount > 0 ? "credit" : "debit",
      amount: t.amount ?? t.creditAmount ?? t.debitAmount ?? 0,
      description: t.narration ?? t.description ?? "",
      party: t.counterPartyAccountName ?? t.counterPartyName ?? "",
      date: t.createdAt ?? t.date,
      status: t.status?.toLowerCase() ?? "success",
      category: inferCategory(t.narration ?? ""),
      reference: t.sessionId ?? t.reference ?? t._id,
    }));

    res.json({ transactions, total: data?.data?.total ?? transactions.length });
  } catch (err) {
    req.log.error({ err }, "transactions error");
    res.status(500).json({ message: "Internal error" });
  }
});

function inferCategory(narration: string): string {
  const n = narration.toLowerCase();
  if (n.includes("airtime")) return "airtime";
  if (n.includes("data")) return "data";
  if (n.includes("electricity") || n.includes("disco") || n.includes("phcn") || n.includes("token")) return "bill";
  if (n.includes("dstv") || n.includes("gotv") || n.includes("startimes") || n.includes("cable")) return "bill";
  if (n.includes("transfer") || n.includes("payment") || n.includes("nip")) return "transfer";
  return "transfer";
}

// POST /api/zela/transfer/verify
router.post("/transfer/verify", async (req, res) => {
  if (!isConfigured()) return notConfigured(res);
  const { accountNumber, bankCode } = req.body as { accountNumber: string; bankCode: string };
  if (!accountNumber || !bankCode) return res.status(400).json({ message: "accountNumber and bankCode required" });

  try {
    const r = await shPost("/transfers/name-enquiry", { accountNumber, bankCode });
    const data = await r.json() as any;
    if (!r.ok) return res.status(r.status).json({ message: data?.message ?? "Verification failed" });
    res.json({
      accountName: data?.data?.accountName ?? data?.accountName ?? "",
      accountNumber: data?.data?.accountNumber ?? accountNumber,
    });
  } catch (err) {
    req.log.error({ err }, "verify error");
    res.status(500).json({ message: "Internal error" });
  }
});

// POST /api/zela/transfer/send
router.post("/transfer/send", async (req, res) => {
  if (!isConfigured()) return notConfigured(res);
  const { accountNumber, bankCode, amount, narration } = req.body as {
    accountNumber: string; bankCode: string; amount: number; narration: string;
  };
  if (!accountNumber || !bankCode || !amount) {
    return res.status(400).json({ message: "accountNumber, bankCode, and amount required" });
  }

  try {
    const r = await shPost("/transfers/nip", {
      nameEnquirySessionID: req.body.sessionId,
      creditAccountNumber: accountNumber,
      creditBankCode: bankCode,
      amount,
      narration: narration ?? "Guudees Transfer",
    });
    const data = await r.json() as any;
    if (!r.ok) return res.status(r.status).json({ message: data?.message ?? "Transfer failed" });
    res.json({
      reference: data?.data?.sessionId ?? data?.data?.reference ?? "",
      status: data?.data?.status ?? "success",
    });
  } catch (err) {
    req.log.error({ err }, "send error");
    res.status(500).json({ message: "Internal error" });
  }
});

// POST /api/zela/bills/airtime
router.post("/bills/airtime", async (req, res) => {
  if (!isConfigured()) return notConfigured(res);
  const { network, phone, amount } = req.body as { network: string; phone: string; amount: number };
  if (!network || !phone || !amount) return res.status(400).json({ message: "network, phone, amount required" });

  try {
    const networkCode: Record<string, string> = { MTN: "MTN", Airtel: "AIRTEL", Glo: "GLO", "9mobile": "9MOBILE" };
    const r = await shPost("/bills/airtime", {
      phoneNumber: phone,
      networkProvider: networkCode[network] ?? network.toUpperCase(),
      amount,
    });
    const data = await r.json() as any;
    if (!r.ok) return res.status(r.status).json({ message: data?.message ?? "Airtime purchase failed" });
    res.json({ reference: data?.data?.reference ?? data?.data?.transactionReference ?? "" });
  } catch (err) {
    req.log.error({ err }, "airtime error");
    res.status(500).json({ message: "Internal error" });
  }
});

// POST /api/zela/bills/data
router.post("/bills/data", async (req, res) => {
  if (!isConfigured()) return notConfigured(res);
  const { network, phone, planCode, amount } = req.body as {
    network: string; phone: string; planCode: string; amount: number;
  };
  try {
    const networkCode: Record<string, string> = { MTN: "MTN", Airtel: "AIRTEL", Glo: "GLO", "9mobile": "9MOBILE" };
    const r = await shPost("/bills/data", {
      phoneNumber: phone,
      networkProvider: networkCode[network] ?? network.toUpperCase(),
      dataCode: planCode,
      amount,
    });
    const data = await r.json() as any;
    if (!r.ok) return res.status(r.status).json({ message: data?.message ?? "Data purchase failed" });
    res.json({ reference: data?.data?.reference ?? "" });
  } catch (err) {
    req.log.error({ err }, "data error");
    res.status(500).json({ message: "Internal error" });
  }
});

// POST /api/zela/bills/electricity
router.post("/bills/electricity", async (req, res) => {
  if (!isConfigured()) return notConfigured(res);
  const { disco, meterNumber, meterType, amount } = req.body as {
    disco: string; meterNumber: string; meterType: string; amount: number;
  };
  try {
    const r = await shPost("/bills/electricity", {
      disco,
      meterNumber,
      meterType: meterType?.toUpperCase() ?? "PREPAID",
      amount,
    });
    const data = await r.json() as any;
    if (!r.ok) return res.status(r.status).json({ message: data?.message ?? "Bill payment failed" });
    res.json({ reference: data?.data?.reference ?? "", token: data?.data?.token });
  } catch (err) {
    req.log.error({ err }, "electricity error");
    res.status(500).json({ message: "Internal error" });
  }
});

// POST /api/zela/bills/cable
router.post("/bills/cable", async (req, res) => {
  if (!isConfigured()) return notConfigured(res);
  const { provider, smartCardNumber, packageCode, amount } = req.body as {
    provider: string; smartCardNumber: string; packageCode: string; amount: number;
  };
  try {
    const r = await shPost("/bills/cable-tv", {
      provider: provider.toUpperCase(),
      smartCardNumber,
      packageCode,
      amount,
    });
    const data = await r.json() as any;
    if (!r.ok) return res.status(r.status).json({ message: data?.message ?? "Cable payment failed" });
    res.json({ reference: data?.data?.reference ?? "" });
  } catch (err) {
    req.log.error({ err }, "cable error");
    res.status(500).json({ message: "Internal error" });
  }
});

// GET /api/zela/banks
router.get("/banks", async (req, res) => {
  if (!isConfigured()) {
    return res.json({ banks: FALLBACK_BANKS });
  }
  try {
    const r = await shGet("/transfers/banks");
    const data = await r.json() as any;
    if (!r.ok) return res.json({ banks: FALLBACK_BANKS });
    const banks = (data?.data ?? []).map((b: any) => ({
      name: b.bankName ?? b.name,
      code: b.bankCode ?? b.code,
    }));
    res.json({ banks: banks.length ? banks : FALLBACK_BANKS });
  } catch {
    res.json({ banks: FALLBACK_BANKS });
  }
});

const FALLBACK_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Zenith Bank", code: "057" },
  { name: "GTBank", code: "058" },
  { name: "First Bank", code: "011" },
  { name: "UBA", code: "033" },
  { name: "Fidelity Bank", code: "070" },
  { name: "Sterling Bank", code: "232" },
  { name: "Kuda Bank", code: "090267" },
  { name: "Opay", code: "304" },
  { name: "Palmpay", code: "999991" },
  { name: "Moniepoint", code: "50515" },
  { name: "Wema Bank", code: "035" },
  { name: "Stanbic IBTC", code: "221" },
  { name: "Union Bank", code: "032" },
  { name: "Polaris Bank", code: "076" },
  { name: "Guudees Digital Services", code: "090xxx" },
];

export default router;
