/**
 * Apps Script - Portal de Processos / Base de Conhecimento + Login por Planilha
 *
 * COMO USAR O LOGIN:
 * 1. Crie uma aba na planilha chamada: USUARIOS
 * 2. Na primeira linha coloque estes cabeçalhos:
 *    Usuario | Senha | Nome | Cargo | Ativo
 * 3. Exemplos de linhas:
 *    lu | 123456 | Lu | Owner | SIM
 *    vendedor01 | abc123 | Vendedor 01 | Comercial | SIM
 * 4. Para permitir editar URL do Apps Script dentro do site, coloque Cargo como: Owner.
 * 5. Para bloquear alguém, coloque Ativo como: NÃO, INATIVO, BLOQUEADO ou FALSE.
 *
 * IMPORTANTE:
 * Sempre que alterar este código, vá em Implantar > Gerenciar implantações > Editar > Nova versão > Implantar.
 */

const CONFIG = {
  // Se o script estiver vinculado à planilha, deixe vazio.
  // Se estiver em um projeto separado, coloque aqui o ID da planilha.
  SPREADSHEET_ID: "",

  SHEETS_BY_LANG: {
    pt: ["BASE DE CONHECIMENTO", "MANUAL", "TUTORIAIS"],
    en: ["KNOWLEDGE BASE", "MANUAL", "TUTORIALS"],
    es: ["BASE DE CONOCIMIENTOS", "MANUAL", "TUTORIALES"],
  },

  CITIES_SHEET: "CIDADES",

  // O sistema procura a primeira aba existente desta lista.
  USERS_SHEETS: ["USUARIOS", "USUÁRIOS", "USERS", "ACESSOS", "CONTAS", "LOGIN"],
};

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = String(params.action || "").toLowerCase().trim();

    if (action === "check") {
      return jsonOutput_({ ok: true, message: "Apps Script online", timestamp: new Date().toISOString() });
    }

    return getKnowledgeBaseResponse_(params);
  } catch (error) {
    return jsonOutput_({
      ok: false,
      error: error && error.message ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
}

function doPost(e) {
  try {
    const body = parseRequestBody_(e);
    const action = String(body.action || "").toLowerCase().trim();

    if (action === "login") {
      return jsonOutput_(validateLogin_(body));
    }

    return getKnowledgeBaseResponse_(body);
  } catch (error) {
    return jsonOutput_({
      ok: false,
      error: error && error.message ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
}

function getKnowledgeBaseResponse_(params) {
  const lang = String((params && params.lang) || "pt").toLowerCase().trim();
  const debug = String((params && params.debug) || "") === "1";

  const spreadsheet = getSpreadsheet_();
  const tutorialSheet = findFirstExistingSheet_(spreadsheet, CONFIG.SHEETS_BY_LANG[lang] || CONFIG.SHEETS_BY_LANG.pt);
  const citiesSheet = spreadsheet.getSheetByName(CONFIG.CITIES_SHEET);
  const usersSheet = findFirstExistingSheet_(spreadsheet, CONFIG.USERS_SHEETS);

  const result = {
    ok: true,
    lang: lang,
    tutorials: tutorialSheet ? getSheetData_(tutorialSheet) : [],
    cities: citiesSheet ? getSheetData_(citiesSheet) : [],
    timestamp: new Date().toISOString(),
  };

  if (debug) {
    result.debug = {
      spreadsheetName: spreadsheet.getName(),
      tutorialSheetUsed: tutorialSheet ? tutorialSheet.getName() : null,
      citiesSheetFound: !!citiesSheet,
      usersSheetFound: usersSheet ? usersSheet.getName() : null,
      availableSheets: spreadsheet.getSheets().map(function (sheet) { return sheet.getName(); }),
      tutorialRows: result.tutorials.length,
      cityRows: result.cities.length,
    };
  }

  return jsonOutput_(result);
}

function validateLogin_(body) {
  const username = normalizeLogin_(body.username || body.usuario || body.user || body.login || body.email);
  const password = String(body.password || body.senha || body.pass || "").trim();

  if (!username || !password) {
    return { ok: false, error: "Informe usuário e senha." };
  }

  const spreadsheet = getSpreadsheet_();
  const usersSheet = findFirstExistingSheet_(spreadsheet, CONFIG.USERS_SHEETS);

  if (!usersSheet) {
    return {
      ok: false,
      error: "Aba de usuários não encontrada. Crie uma aba chamada USUARIOS com as colunas Usuario, Senha, Nome, Cargo e Ativo.",
    };
  }

  const users = getSheetData_(usersSheet);

  for (let i = 0; i < users.length; i++) {
    const row = users[i];

    const rowLogin = normalizeLogin_(getValueByKeys_(row, [
      "usuario", "usuário", "user", "username", "login", "email", "conta", "nome de usuario", "nome de usuário"
    ]));

    const rowPassword = String(getValueByKeys_(row, [
      "senha", "password", "pass", "chave", "codigo", "código"
    ]) || "").trim();

    if (!rowLogin || rowLogin !== username) continue;

    if (rowPassword !== password) {
      return { ok: false, error: "Usuário ou senha inválidos." };
    }

    if (!isUserActive_(row)) {
      return { ok: false, error: "Esta conta está bloqueada ou inativa na planilha." };
    }

    const name = String(getValueByKeys_(row, ["nome", "name", "display", "apelido"]) || rowLogin).trim();
    const role = String(getValueByKeys_(row, ["cargo", "role", "funcao", "função", "nivel", "nível"]) || "").trim();
    const email = String(getValueByKeys_(row, ["email", "e-mail", "mail"]) || "").trim();

    return {
      ok: true,
      user: {
        username: rowLogin,
        name: name,
        role: role,
        email: email,
      },
      timestamp: new Date().toISOString(),
    };
  }

  return { ok: false, error: "Usuário ou senha inválidos." };
}

function isUserActive_(row) {
  const rawStatus = getValueByKeys_(row, ["ativo", "active", "status", "acesso", "permitido", "liberado", "enabled"]);

  // Se a coluna não existir ou estiver vazia, considera ativo para facilitar.
  if (rawStatus === null || rawStatus === undefined || String(rawStatus).trim() === "") {
    return true;
  }

  const status = normalizeText_(rawStatus);
  const blocked = ["nao", "no", "false", "0", "inativo", "inativa", "bloqueado", "bloqueada", "off", "desativado", "desativada", "banido", "banida", "suspenso", "suspensa"];

  return blocked.indexOf(status) === -1;
}

function parseRequestBody_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (error) {
      return e.parameter || {};
    }
  }

  return e && e.parameter ? e.parameter : {};
}

function getSpreadsheet_() {
  const configuredId = String(CONFIG.SPREADSHEET_ID || "").trim();

  if (configuredId) {
    return SpreadsheetApp.openById(configuredId);
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error("Nenhuma planilha ativa encontrada. Vincule o Apps Script à planilha ou preencha CONFIG.SPREADSHEET_ID.");
  }

  return active;
}

function findFirstExistingSheet_(spreadsheet, possibleNames) {
  for (let i = 0; i < possibleNames.length; i++) {
    const sheet = spreadsheet.getSheetByName(possibleNames[i]);
    if (sheet) return sheet;
  }
  return null;
}

function getSheetData_(sheet) {
  const range = sheet.getDataRange();
  const values = range.getDisplayValues();

  if (!values || values.length < 2) return [];

  const headers = values[0].map(function (header) {
    return String(header || "").trim();
  });

  const rows = values.slice(1);
  const output = [];

  rows.forEach(function (row) {
    const isEmpty = row.every(function (cell) {
      return String(cell || "").trim() === "";
    });

    if (isEmpty) return;

    const item = {};

    headers.forEach(function (header, index) {
      if (!header) return;
      item[header] = String(row[index] || "").trim();
    });

    output.push(item);
  });

  return output;
}

function getValueByKeys_(item, searchKeys) {
  const itemKeys = Object.keys(item || {});
  const normalizedSearchKeys = searchKeys.map(function (key) { return normalizeText_(key); });

  for (let i = 0; i < normalizedSearchKeys.length; i++) {
    const searchKey = normalizedSearchKeys[i];
    const exactKey = itemKeys.find(function (key) { return normalizeText_(key) === searchKey; });
    if (exactKey) return item[exactKey];
  }

  for (let i = 0; i < normalizedSearchKeys.length; i++) {
    const searchKey = normalizedSearchKeys[i];
    const partialKey = itemKeys.find(function (key) {
      const normalizedKey = normalizeText_(key);
      return normalizedKey.indexOf(searchKey) !== -1 || searchKey.indexOf(normalizedKey) !== -1;
    });
    if (partialKey) return item[partialKey];
  }

  return null;
}

function normalizeLogin_(value) {
  return String(value || "").toLowerCase().trim();
}

function normalizeText_(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
