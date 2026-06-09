export interface TutorialRecord {
  id: string | number;
  category: string;
  subcategory: string;
  title: string;
  primaryQuestion: string;
  keywords: string[];
  objective: string;
  steps: string;
}

export interface CityRecord {
  name: string;
  icon: string;
  invite: string;
}

export interface KnowledgeBaseResponse {
  tutorials: TutorialRecord[];
  cities: CityRecord[];
  timestamp?: string;
}

const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxZc8VrvKH0o95pAhFVc4AWN84enoUc9CiaMe9nDnxc8CQO3cMZAm462gNDxaW5-3CM/exec";

const normalize = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const cleanText = (value: unknown) => String(value ?? "").trim();

const cleanUrl = (value?: string) =>
  String(value || "")
    .replace(/["']/g, "")
    .replace(/\s/g, "")
    .trim();

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
      name:
        cleanText(findKey(item, ["cidade", "city", "name", "nome", "local", "unidade"])) || "Desconhecida",
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

export async function fetchKnowledgeBase(lang = "pt", manualUrl?: string): Promise<KnowledgeBaseResponse> {
  const appsScriptUrl = getConfiguredAppsScriptUrl(manualUrl);
  const requestedLang = cleanText(lang).toLowerCase() || "pt";
  const timeoutMs = Number(process.env.APPS_SCRIPT_TIMEOUT_MS || 25000);

  const url = new URL(appsScriptUrl);
  url.searchParams.set("lang", requestedLang);
  url.searchParams.set("_t", Date.now().toString());

  const startedAt = Date.now();
  console.log(`[KnowledgeBase] Fetching ${requestedLang} from Apps Script`);

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
    throw new Error(`Apps Script não retornou JSON válido: ${error.message}`);
  }

  if (rawData?.ok === false) {
    throw new Error(rawData?.error || "Apps Script retornou erro.");
  }

  const tutorialsSource = Array.isArray(rawData?.tutorials) ? rawData.tutorials : Array.isArray(rawData) ? rawData : [];
  const citiesSource = Array.isArray(rawData?.cities) ? rawData.cities : [];

  const result = {
    tutorials: mapTutorials(tutorialsSource),
    cities: mapCities(citiesSource),
    timestamp: rawData?.timestamp || new Date().toISOString(),
  };

  console.log(
    `[KnowledgeBase] OK ${requestedLang}: ${result.tutorials.length} tutoriais, ${result.cities.length} cidades em ${durationMs}ms`
  );

  return result;
}
