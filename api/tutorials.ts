import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";

interface TutorialRecord {
  id: string | number;
  category: string;
  subcategory: string;
  title: string;
  primaryQuestion: string;
  keywords: string[];
  objective: string;
  steps: string;
}

interface CityRecord {
  name: string;
  icon: string;
  invite: string;
}

const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxZc8VrvKH0o95pAhFVc4AWN84enoUc9CiaMe9nDnxc8CQO3cMZAm462gNDxaW5-3CM/exec";

export const config = {
  maxDuration: 60,
};

function setDefaultHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-manual-script-url");
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

function getAuthSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.APPS_SCRIPT_URL ||
    "processos-comercial-auth-secret-v7-2026"
  );
}

function parseAuthToken(token: string) {
  try {
    const [encodedPayload, signature] = String(token || "").split(".");
    if (!encodedPayload || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", getAuthSecret())
      .update(encodedPayload)
      .digest("base64url");

    const provided = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);

    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);

    if (!payload?.sub || !payload?.exp || Number(payload.exp) < now) {
      return null;
    }

    return payload;
  } catch (_error) {
    return null;
  }
}

function getBearerToken(req: VercelRequest) {
  const auth = String(req.headers.authorization || "");
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}


function normalize(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function isOwnerRole(value: unknown) {
  return normalize(value) === "owner";
}

function getConfiguredAppsScriptUrl(manualUrl?: string) {
  const candidates = [
    manualUrl,
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

function findKey(item: Record<string, unknown>, searchKeys: string[]) {
  const itemKeys = Object.keys(item || {});
  const normalizedSearchKeys = searchKeys.map(normalize);

  for (const searchKey of normalizedSearchKeys) {
    const exactKey = itemKeys.find((key) => normalize(key) === searchKey);
    if (exactKey) return item[exactKey];
  }

  for (const searchKey of normalizedSearchKeys) {
    const partialKey = itemKeys.find((key) => {
      const normalizedKey = normalize(key);
      return normalizedKey.includes(searchKey) || searchKey.includes(normalizedKey);
    });
    if (partialKey) return item[partialKey];
  }

  return null;
}

function parseKeywords(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => cleanText(item)).filter(Boolean);
  }

  return cleanText(value)
    .split(/[,;|\n]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapTutorials(rawItems: unknown[]): TutorialRecord[] {
  return rawItems
    .filter((item): item is Record<string, unknown> => item && typeof item === "object" && !Array.isArray(item))
    .map((item, index) => {
      const title = findKey(item, [
        "title",
        "titulo",
        "título",
        "assunto",
        "subject",
        "duvida",
        "dúvida",
        "pergunta",
        "question",
      ]);

      const primaryQuestion = findKey(item, [
        "primaryQuestion",
        "pergunta principal",
        "pergunta",
        "question",
        "duvida",
        "dúvida",
        "questao",
        "questão",
        "titulo",
        "título",
      ]);

      return {
        id: cleanText(findKey(item, ["id", "identificador", "codigo", "código", "cod", "id_manual"])) || `tut-${index + 1}`,
        category:
          cleanText(
            findKey(item, [
              "category",
              "categoria",
              "classification",
              "classe",
              "setor",
              "departamento",
              "area",
              "área",
              "setores",
            ])
          ) || "Geral",
        subcategory:
          cleanText(
            findKey(item, [
              "subcategory",
              "subcategoria",
              "sub categoria",
              "subtitulo",
              "subtítulo",
              "subtitle",
              "sub-classe",
              "grupo",
            ])
          ) || "Diversos",
        title: cleanText(title || primaryQuestion) || `Tutorial #${index + 1}`,
        primaryQuestion: cleanText(primaryQuestion || title),
        keywords: parseKeywords(
          findKey(item, [
            "keywords",
            "palavras chave",
            "palavras_chave",
            "palavras-chave",
            "palavras",
            "tags",
            "termos",
            "labels",
          ])
        ),
        objective: cleanText(
          findKey(item, ["objective", "objetivo", "finalidade", "resumo", "description", "descrição", "descricao"])
        ),
        steps:
          cleanText(
            findKey(item, [
              "steps",
              "passos",
              "conteudo",
              "conteúdo",
              "content",
              "descrição / passo a passo completo",
              "descricao / passo a passo completo",
              "passo a passo",
              "passo-a-passo",
              "completo",
              "tutorial",
              "corpo",
              "resposta",
              "explicação",
              "explicacao",
              "como fazer",
              "manual",
            ])
          ) || "Nenhum conteúdo disponível.",
      };
    });
}

function mapCities(rawItems: unknown[]): CityRecord[] {
  return rawItems
    .filter((item): item is Record<string, unknown> => item && typeof item === "object" && !Array.isArray(item))
    .map((item) => ({
      name: cleanText(findKey(item, ["cidade", "city", "name", "nome", "local", "unidade"])) || "Desconhecida",
      icon: cleanText(findKey(item, ["imagem", "icon", "icone", "image", "foto", "logo", "placeholder"])),
      invite: cleanText(findKey(item, ["convite", "invite", "link", "url", "acesso", "whatsapp", "grupo"])),
    }))
    .filter((city) => city.name !== "Desconhecida" || city.icon || city.invite);
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json,text/plain,*/*",
        "User-Agent": "processos-comercial-vercel/1.0",
      },
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchKnowledgeBase(lang = "pt", manualUrl?: string) {
  const appsScriptUrl = getConfiguredAppsScriptUrl(manualUrl);
  const requestedLang = cleanText(lang).toLowerCase() || "pt";
  const timeoutMs = Number(process.env.APPS_SCRIPT_TIMEOUT_MS || 25000);

  const url = new URL(appsScriptUrl);
  url.searchParams.set("lang", requestedLang);
  url.searchParams.set("_t", Date.now().toString());

  const startedAt = Date.now();
  const response = await fetchWithTimeout(url.toString(), timeoutMs);
  const durationMs = Date.now() - startedAt;
  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`Apps Script respondeu HTTP ${response.status} em ${durationMs}ms: ${bodyText.slice(0, 180)}`);
  }

  const trimmedBody = bodyText.trim();

  if (!trimmedBody) {
    throw new Error("Apps Script retornou resposta vazia. Verifique se a implantação está ativa.");
  }

  if (/^<!doctype html/i.test(trimmedBody) || /^<html/i.test(trimmedBody)) {
    throw new Error("Apps Script retornou HTML em vez de JSON. Reimplante como App da Web e libere para Qualquer pessoa.");
  }

  let rawData: any;
  try {
    rawData = JSON.parse(trimmedBody);
  } catch (error: any) {
    throw new Error(`Apps Script não retornou JSON válido: ${error?.message || String(error)}`);
  }

  if (rawData?.ok === false) {
    throw new Error(rawData?.error || "Apps Script retornou erro.");
  }

  const tutorialsSource = Array.isArray(rawData?.tutorials) ? rawData.tutorials : Array.isArray(rawData) ? rawData : [];
  const citiesSource = Array.isArray(rawData?.cities) ? rawData.cities : [];

  return {
    tutorials: mapTutorials(tutorialsSource),
    cities: mapCities(citiesSource),
    timestamp: rawData?.timestamp || new Date().toISOString(),
    source: "apps-script",
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setDefaultHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const session = parseAuthToken(getBearerToken(req));
  if (!session) {
    return res.status(401).json({
      error: "Login obrigatório",
      details: "Faça login com uma conta ativa cadastrada na planilha para acessar os manuais.",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const lang = String(req.query.lang || "pt");
    const requestedManualUrl = typeof req.headers["x-manual-script-url"] === "string" ? req.headers["x-manual-script-url"] : undefined;
    const manualUrl = isOwnerRole((session as any)?.role) ? requestedManualUrl : undefined;
    const data = await fetchKnowledgeBase(lang, manualUrl);
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("[api/tutorials] Falha na sincronização:", error?.message || error);

    // Importante: sempre responder JSON, para o Vercel não exibir tela genérica de crash.
    return res.status(500).json({
      error: "Falha na sincronização",
      details: error?.message || "Erro desconhecido",
      hint: "Confira a variável APPS_SCRIPT_URL no Vercel e teste a URL do Apps Script terminando em /exec.",
      timestamp: new Date().toISOString(),
    });
  }
}
