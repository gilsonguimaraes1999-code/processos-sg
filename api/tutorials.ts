import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchKnowledgeBase } from "../src/backend/knowledgeBase";

function setDefaultHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-manual-script-url");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setDefaultHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const lang = String(req.query.lang || "pt");
    const manualUrl = typeof req.headers["x-manual-script-url"] === "string" ? req.headers["x-manual-script-url"] : undefined;
    const data = await fetchKnowledgeBase(lang, manualUrl);
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("[api/tutorials] Falha na sincronização:", error?.message || error);
    return res.status(500).json({
      error: "Falha na sincronização",
      details: error?.message || "Erro desconhecido",
    });
  }
}
