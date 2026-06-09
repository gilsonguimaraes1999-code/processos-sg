import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxZc8VrvKH0o95pAhFVc4AWN84enoUc9CiaMe9nDnxc8CQO3cMZAm462gNDxaW5-3CM/exec";

export const config = {
  maxDuration: 60,
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanUrl(value?: string) {
  return String(value || "")
    .replace(/["']/g, "")
    .replace(/\s/g, "")
    .trim();
}

function normalize(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getConfiguredAppsScriptUrl() {
  const candidates = [process.env.APPS_SCRIPT_URL, process.env.VITE_APPS_SCRIPT_URL, DEFAULT_APPS_SCRIPT_URL];

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
  if (Array.isArray(value)) return value.map((item) => cleanText(item)).filter(Boolean);
  return cleanText(value)
    .split(/[,;|\n]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapTutorials(rawItems: unknown[]) {
  return rawItems
    .filter((item): item is Record<string, unknown> => item && typeof item === "object" && !Array.isArray(item))
    .map((item, index) => {
      const title = findKey(item, ["title", "titulo", "título", "assunto", "subject", "duvida", "dúvida", "pergunta", "question"]);
      const primaryQuestion = findKey(item, ["primaryQuestion", "pergunta principal", "pergunta", "question", "duvida", "dúvida", "questao", "questão", "titulo", "título"]);

      return {
        id: cleanText(findKey(item, ["id", "identificador", "codigo", "código", "cod", "id_manual"])) || `tut-${index + 1}`,
        category: cleanText(findKey(item, ["category", "categoria", "classification", "classe", "setor", "departamento", "area", "área", "setores"])) || "Geral",
        title: cleanText(title || primaryQuestion) || `Tutorial #${index + 1}`,
        primaryQuestion: cleanText(primaryQuestion || title),
        objective: cleanText(findKey(item, ["objective", "objetivo", "finalidade", "resumo", "description", "descrição", "descricao"])),
        keywords: parseKeywords(findKey(item, ["keywords", "palavras chave", "palavras_chave", "palavras-chave", "palavras", "tags", "termos", "labels"])),
      };
    });
}

async function fetchKnowledgeBase(lang = "pt") {
  const url = new URL(getConfiguredAppsScriptUrl());
  url.searchParams.set("lang", cleanText(lang).toLowerCase() || "pt");
  url.searchParams.set("_t", Date.now().toString());

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.APPS_SCRIPT_TIMEOUT_MS || 25000));

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json,text/plain,*/*" },
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
    });

    const bodyText = await response.text();
    if (!response.ok) throw new Error(`Apps Script respondeu HTTP ${response.status}: ${bodyText.slice(0, 180)}`);

    const body = bodyText.trim();
    if (/^<!doctype html/i.test(body) || /^<html/i.test(body)) {
      throw new Error("Apps Script retornou HTML em vez de JSON.");
    }

    const rawData = JSON.parse(body);
    const tutorialsSource = Array.isArray(rawData?.tutorials) ? rawData.tutorials : Array.isArray(rawData) ? rawData : [];
    return { tutorials: mapTutorials(tutorialsSource) };
  } finally {
    clearTimeout(timeout);
  }
}

function getAI() {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { query, lang = "pt" } = req.body || {};
  if (!query) return res.status(400).json({ error: "Query is required" });

  const ai = getAI();
  if (!ai) return res.status(503).json({ error: "GEMINI_API_KEY não configurada" });

  try {
    const data = await fetchKnowledgeBase(lang);
    const context = data.tutorials.map((tutorial) => ({
      id: tutorial.id,
      title: tutorial.title,
      category: tutorial.category,
      objective: tutorial.objective,
      keywords: tutorial.keywords,
    }));

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Com base nesta lista de tutoriais, escolha qual tutorial melhor responde à dúvida: "${query}". Retorne apenas JSON com tutorialId, reason em PT-BR e confidence de 0 a 1. Lista: ${JSON.stringify(context)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tutorialId: { type: Type.STRING },
            reason: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ["tutorialId", "reason", "confidence"],
        },
      },
    });

    return res.status(200).json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("[api/ai-search] Erro:", error?.message || error);
    return res.status(500).json({ error: "AI search failed", details: error?.message || "Erro desconhecido" });
  }
}
