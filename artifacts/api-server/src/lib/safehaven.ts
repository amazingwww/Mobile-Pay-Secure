import { logger } from "./logger";

const BASE_URL = process.env["SAFE_HAVEN_BASE_URL"] ?? "https://api.sandbox.safehavenmfb.com";
const CLIENT_ID = process.env["SAFE_HAVEN_CLIENT_ID"] ?? "";
const CLIENT_SECRET = process.env["SAFE_HAVEN_CLIENT_SECRET"] ?? "";
const IBS_CLIENT_ID = process.env["SAFE_HAVEN_IBS_CLIENT_ID"] ?? "";

type TokenCache = {
  accessToken: string;
  expiresAt: number;
  ibs_client_id: string;
  ibs_user_id: string;
};

let tokenCache: TokenCache | null = null;

export async function getAccessToken(): Promise<TokenCache> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 30_000) {
    return tokenCache;
  }

  const res = await fetch(`${BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error({ status: res.status, body: text }, "Safe Haven token error");
    throw new Error(`Safe Haven auth failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    ibs_client_id: string;
    ibs_user_id: string;
  };

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    ibs_client_id: data.ibs_client_id ?? IBS_CLIENT_ID,
    ibs_user_id: data.ibs_user_id ?? "",
  };

  return tokenCache;
}

export async function shGet(path: string) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      "ClientID": token.ibs_client_id,
    },
  });
  return res;
}

export async function shPost(path: string, body: unknown) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      "ClientID": token.ibs_client_id,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res;
}

export function isConfigured(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET);
}
