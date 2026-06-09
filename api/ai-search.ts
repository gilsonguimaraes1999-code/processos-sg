import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";
import { fetchKnowledgeBase } from "../src/backend/knowledgeBase";

function setDefaultHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

function getBody(req: VercelRequest) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setDefaultHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "GEMINI_API_KEY não configurada no Vercel" });
  }

  const body = getBody(req) as { query?: string; lang?: string };
  const query = String(body.query || "").trim();
  const lang = String(body.lang || "pt");

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const data = await fetchKnowledgeBase(lang);
    const context = data.tutorials.map((tutorial) => ({
      id: tutorial.id,
      title: tutorial.title,
      category: tutorial.category,
      objective: tutorial.objective,
      keywords: tutorial.keywords,
    }));

    const ai = new GoogleGenAI({ apiKey });
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
