import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    status: "ok",
    message: "API do Portal de Processos online. Use /api/tutorials?lang=pt",
  });
}
