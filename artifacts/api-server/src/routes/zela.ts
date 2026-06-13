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
  // 1. Try Safe Haven (when credentials are set)
  if (isConfigured()) {
    try {
      const r = await shGet("/transfers/banks");
      const data = await r.json() as any;
      if (r.ok) {
        const banks = (data?.data ?? []).map((b: any) => ({
          name: b.bankName ?? b.name,
          code: b.bankCode ?? b.code,
        })).filter((b: any) => b.name && b.code);
        if (banks.length) return res.json({ banks });
      }
    } catch (err) {
      req.log.warn({ err }, "Safe Haven banks fetch failed, falling back");
    }
  }

  // 2. Fetch from Paystack public NIBSS list (free, no auth)
  try {
    const r = await fetch("https://api.paystack.co/bank?country=nigeria&perPage=200&use_cursor=false", {
      headers: { "Cache-Control": "no-cache" },
    });
    if (r.ok) {
      const data = await r.json() as any;
      const banks = (data?.data ?? [])
        .filter((b: any) => b.active && !b.is_deleted && b.code && b.name)
        .map((b: any) => ({ name: b.name, code: b.code }));
      if (banks.length) {
        req.log.info({ count: banks.length }, "banks fetched from NIBSS via Paystack");
        return res.json({ banks });
      }
    }
  } catch (err) {
    req.log.warn({ err }, "Paystack banks fetch failed, using hardcoded list");
  }

  // 3. Comprehensive hardcoded NIBSS list
  res.json({ banks: NIBSS_BANKS });
});

// Full NIBSS-sourced bank list (commercial banks + fintechs + MFBs)
const NIBSS_BANKS = [
  // Commercial Banks
  { name: "Access Bank", code: "044" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "FCMB", code: "214" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "GTBank", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Keystone Bank", code: "082" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Titan Trust Bank", code: "102" },
  { name: "UBA", code: "033" },
  { name: "Union Bank", code: "032" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
  // Non-interest Banks
  { name: "Jaiz Bank", code: "301" },
  { name: "Lotus Bank", code: "303" },
  { name: "Taj Bank", code: "302" },
  // Merchant/Development Banks
  { name: "Coronation Merchant Bank", code: "559" },
  { name: "FBNQuest Merchant Bank", code: "060002" },
  { name: "FSDH Merchant Bank", code: "501" },
  { name: "Nova Merchant Bank", code: "060003" },
  { name: "Rand Merchant Bank", code: "502" },
  // Payment Service Banks
  { name: "9Payment Service Bank (9PSB)", code: "120001" },
  { name: "Hope PSBank", code: "120002" },
  { name: "Moneymaster PSBank", code: "120003" },
  // Fintechs & MFBs
  { name: "Carbon", code: "565" },
  { name: "Eyowo", code: "50126" },
  { name: "Fairmoney Microfinance Bank", code: "090325" },
  { name: "Kuda Bank", code: "090267" },
  { name: "Mint Finex MFB", code: "090110" },
  { name: "Mkobo MFB", code: "090115" },
  { name: "Moniepoint MFB", code: "50515" },
  { name: "Opay", code: "100004" },
  { name: "Paga", code: "100002" },
  { name: "PalmPay", code: "999991" },
  { name: "Rubies MFB", code: "090175" },
  { name: "Sparkle MFB", code: "090325" },
  { name: "VFD Microfinance Bank", code: "566" },
  { name: "Guudees Digital Services", code: "090xxx" },
];

export default router;
