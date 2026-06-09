import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";

const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxZc8VrvKH0o95pAhFVc4AWN84enoUc9CiaMe9nDnxc8CQO3cMZAm462gNDxaW5-3CM/exec";

export const config = {
  maxDuration: 60,
};

function setDefaultHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanUrl(value?: string) {
  return String(value || "")
    .replace(/["']/g, "")
    .replace(/\s/g, "")
    .trim();
}

function getConfiguredAppsScriptUrl() {
  const candidates = [
    process.env.APPS_SCRIPT_URL,
    process.env.VITE_APPS_SCRIPT_URL,
    DEFAULT_APPS_SCRIPT_URL,
  ];

  for (const candidate of candidates) {
    const url = cleanUrl(candidate);
    if (url && /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/i.test(url)) {
      return url;
    }
  }

  return DEFAULT_APPS_SCRIPT_URL;
}

function getAuthSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.APPS_SCRIPT_URL ||
    "processos-comercial-auth-secret-v7-2026"
  );
}

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function signPayload(payload: Record<string, unknown>) {
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", getAuthSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

async function fetchWithTimeout(url: string, body: unknown, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json,text/plain,*/*",
        "Content-Type": "application/json",
        "User-Agent": "processos-comercial-vercel/1.0",
      },
      body: JSON.stringify(body),
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function validateLoginWithAppsScript(username: string, password: string) {
  const appsScriptUrl = getConfiguredAppsScriptUrl();
  const timeoutMs = Number(process.env.APPS_SCRIPT_TIMEOUT_MS || 25000);

  const response = await fetchWithTimeout(
    appsScriptUrl,
    {
      action: "login",
      username,
      password,
      _t: Date.now(),
    },
    timeoutMs
  );

  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`Apps Script respondeu HTTP ${response.status}: ${bodyText.slice(0, 180)}`);
  }

  const trimmedBody = bodyText.trim();

  if (!trimmedBody) {
    throw new Error("Apps Script retornou resposta vazia.");
  }

  if (/^<!doctype html/i.test(trimmedBody) || /^<html/i.test(trimmedBody)) {
    throw new Error("Apps Script retornou HTML em vez de JSON. Reimplante como App da Web e libere para Qualquer pessoa.");
  }

  let data: any;
  try {
    data = JSON.parse(trimmedBody);
  } catch (error: any) {
    throw new Error(`Apps Script não retornou JSON válido: ${error?.message || String(error)}`);
  }

  if (!data?.ok) {
    return {
      ok: false,
      error: cleanText(data?.error) || "Usuário ou senha inválidos.",
    };
  }

  return data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setDefaultHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const username = cleanText(req.body?.username).toLowerCase();
    const password = cleanText(req.body?.password);
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: "Informe usuário e senha." });
    }

    const authResult = await validateLoginWithAppsScript(username, password);

    if (!authResult?.ok) {
      return res.status(401).json({ ok: false, error: authResult?.error || "Usuário ou senha inválidos." });
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresInSeconds = Number(process.env.AUTH_TOKEN_TTL_SECONDS || 43200); // 12 horas
    const user = {
      username: cleanText(authResult?.user?.username || username).toLowerCase(),
      name: cleanText(authResult?.user?.name || authResult?.user?.nome || username),
      role: cleanText(authResult?.user?.role || authResult?.user?.cargo || ""),
      email: cleanText(authResult?.user?.email || ""),
    };

    const token = signPayload({
      sub: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      iat: now,
      exp: now + expiresInSeconds,
    });

    return res.status(200).json({
      ok: true,
      token,
      user,
      expiresAt: new Date((now + expiresInSeconds) * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error("[api/login] Falha no login:", error?.message || error);
    return res.status(500).json({
      ok: false,
      error: "Falha ao validar login.",
      details: error?.message || "Erro desconhecido",
      hint: "Confira se a aba USUARIOS existe na planilha e se o Apps Script foi reimplantado.",
      timestamp: new Date().toISOString(),
    });
  }
}
