/**
 * Apps Script - Portal de Processos / Base de Conhecimento
 *
 * Como usar:
 * 1. Abra a planilha do Google Sheets.
 * 2. Vá em Extensões > Apps Script.
 * 3. Cole este código completo.
 * 4. Clique em Implantar > Nova implantação > App da Web.
 * 5. Executar como: você mesmo.
 * 6. Quem pode acessar: Qualquer pessoa.
 * 7. Copie a URL terminada em /exec e coloque no Vercel como APPS_SCRIPT_URL.
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
};

function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const lang = String(params.lang || "pt").toLowerCase().trim();
    const debug = String(params.debug || "") === "1";

    const spreadsheet = getSpreadsheet_();
    const tutorialSheet = findFirstExistingSheet_(spreadsheet, CONFIG.SHEETS_BY_LANG[lang] || CONFIG.SHEETS_BY_LANG.pt);
    const citiesSheet = spreadsheet.getSheetByName(CONFIG.CITIES_SHEET);

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
        availableSheets: spreadsheet.getSheets().map(function (sheet) { return sheet.getName(); }),
        tutorialRows: result.tutorials.length,
        cityRows: result.cities.length,
      };
    }

    return jsonOutput_(result);
  } catch (error) {
    return jsonOutput_({
      ok: false,
      error: error && error.message ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
}

function doPost(e) {
  return doGet(e);
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

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
