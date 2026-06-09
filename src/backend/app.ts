import express from "express";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { fetchKnowledgeBase } from "./knowledgeBase";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const getAI = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

app.get("/api/tutorials", async (req, res) => {
  try {
    const lang = String(req.query.lang || "pt");
    const manualUrl = req.headers["x-manual-script-url"] as string | undefined;
    const data = await fetchKnowledgeBase(lang, manualUrl);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(data);
  } catch (error: any) {
    console.error("[API Tutorials] Falha:", error?.message || error);
    res.status(500).json({
      error: "Falha na sincronização",
      details: error?.message || "Erro desconhecido",
    });
  }
});

app.post("/api/ai-search", async (req, res) => {
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

    res.status(200).json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("[API AI Search] Erro:", error?.message || error);
    res.status(500).json({ error: "AI search failed", details: error?.message || "Erro desconhecido" });
  }
});

app.get("/api/health", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ status: "ok", platform: "local-express", timestamp: new Date().toISOString() });
});

export default app;
