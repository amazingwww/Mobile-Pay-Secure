import { Router } from "express";
import { isConfigured, shGet, shPost } from "../lib/safehaven";

const router = Router();

function notConfigured(res: any) {
  res.status(503).json({
    message:
      "Safe Haven credentials not configured. Add SAFE_HAVEN_CLIENT_ID, SAFE_HAVEN_CLIENT_SECRET, and SAFE_HAVEN_IBS_CLIENT_ID to your secrets.",
  });
}

// POST /api/zela/kyc/bvn
// Body: { bvn: string, dateOfBirth: string } (dateOfBirth: YYYY-MM-DD)
router.post("/bvn", async (req, res) => {
  if (!isConfigured()) return notConfigured(res);

  const { bvn, dateOfBirth } = req.body as {
    bvn: string;
    dateOfBirth: string; // YYYY-MM-DD from client
  };

  if (!bvn || bvn.length !== 11) {
    return res.status(400).json({ message: "BVN must be 11 digits" });
  }
  if (!dateOfBirth) {
    return res.status(400).json({ message: "Date of birth is required" });
  }

  // Safe Haven expects DD-MM-YYYY
  const [year, month, day] = dateOfBirth.split("-");
  const formattedDob = `${day}-${month}-${year}`;

  try {
    const r = await shPost("/identity/bvn/basic", {
      bvn,
      dateOfBirth: formattedDob,
    });
    const data = (await r.json()) as any;

    if (!r.ok) {
      req.log.error({ status: r.status, data }, "BVN verification error");
      return res
        .status(r.status)
        .json({ message: data?.message ?? "BVN verification failed" });
    }

    const payload = data?.data ?? data;
    res.json({
      verified: true,
      firstName: payload?.firstName ?? "",
      lastName: payload?.lastName ?? "",
      middleName: payload?.middleName ?? "",
      phoneNumber: payload?.phoneNumber ?? "",
      dateOfBirth: payload?.dateOfBirth ?? dateOfBirth,
      bvn,
    });
  } catch (err) {
    req.log.error({ err }, "BVN error");
    res.status(500).json({ message: "Internal error" });
  }
});

// POST /api/zela/kyc/selfie
// Body: { bvn: string, selfieBase64: string, livenessBase64?: string }
router.post("/selfie", async (req, res) => {
  if (!isConfigured()) return notConfigured(res);

  const { bvn, selfieBase64, livenessBase64 } = req.body as {
    bvn: string;
    selfieBase64: string;
    livenessBase64?: string;
  };

  if (!bvn || !selfieBase64) {
    return res.status(400).json({ message: "bvn and selfieBase64 are required" });
  }

  try {
    const r = await shPost("/identity/v2/", {
      type: "BVN",
      async: false,
      number: bvn,
      debitAccountNumber: process.env["SAFE_HAVEN_DEBIT_ACCOUNT"] ?? "",
      image: selfieBase64,
      ...(livenessBase64 ? { livenessImage: livenessBase64 } : {}),
    });

    const data = (await r.json()) as any;

    if (!r.ok) {
      req.log.error({ status: r.status, data }, "Selfie verification error");
      return res
        .status(r.status)
        .json({ message: data?.message ?? "Selfie verification failed" });
    }

    res.json({
      verified: true,
      tier: "Tier 2",
      reference: data?.data?.reference ?? data?.reference ?? "",
    });
  } catch (err) {
    req.log.error({ err }, "Selfie error");
    res.status(500).json({ message: "Internal error" });
  }
});

// GET /api/zela/kyc/status?bvn=
router.get("/status", async (req, res) => {
  if (!isConfigured()) return notConfigured(res);

  const { bvn } = req.query as { bvn: string };
  if (!bvn) return res.status(400).json({ message: "bvn required" });

  try {
    const r = await shGet(`/identity/kyc/status?bvn=${bvn}`);
    const data = (await r.json()) as any;
    if (!r.ok) return res.status(r.status).json({ message: data?.message });
    res.json({ status: data?.data?.status ?? "pending", tier: data?.data?.tier ?? "Tier 1" });
  } catch (err) {
    req.log.error({ err }, "KYC status error");
    res.status(500).json({ message: "Internal error" });
  }
});

export default router;
