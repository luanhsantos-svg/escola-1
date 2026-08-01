/**
 * Camada de persistência do Portal Escolar Integrado.
 * Usa uma planilha Google como banco de dados.
 */

const DATABASE_PROPERTY = 'SPREADSHEET_ID';

function getSpreadsheet_() {
  const properties = PropertiesService.getScriptProperties();
  const storedId = properties.getProperty(DATABASE_PROPERTY);

  if (storedId) {
    return SpreadsheetApp.openById(storedId);
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    properties.setProperty(DATABASE_PROPERTY, active.getId());
    return active;
  }

  const created = SpreadsheetApp.create('Portal Escolar Integrado - Banco de Dados');
  properties.setProperty(DATABASE_PROPERTY, created.getId());
  return created;
}

function getSheet_(sheetName) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`A aba ${sheetName} não existe. Execute setupSystem() primeiro.`);
  }
  return sheet;
}

function listRecords_(sheetName) {
  const sheet = getSheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(String);
  return values.slice(1)
    .filter(row => row.some(value => value !== '' && value !== null))
    .map((row, rowIndex) => {
      const record = { __ROW: rowIndex + 2 };
      headers.forEach((header, index) => {
        record[header] = normalizeCellValue_(row[index]);
      });
      return record;
    });
}

function findRecord_(sheetName, predicate) {
  return listRecords_(sheetName).find(predicate) || null;
}

function appendRecord_(sheetName, record) {
  const sheet = getSheet_(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const row = headers.map(header => serializeCellValue_(record[header]));
  sheet.appendRow(row);
  return record;
}

function updateRecordRow_(sheetName, rowNumber, record) {
  const sheet = getSheet_(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const current = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  const row = headers.map((header, index) => (
    Object.prototype.hasOwnProperty.call(record, header)
      ? serializeCellValue_(record[header])
      : current[index]
  ));
  sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
  return record;
}

function upsertRecordById_(sheetName, record) {
  if (!record.ID) throw new Error(`Registro de ${sheetName} sem ID.`);
  const existing = findRecord_(sheetName, item => String(item.ID) === String(record.ID));
  return existing
    ? updateRecordRow_(sheetName, existing.__ROW, record)
    : appendRecord_(sheetName, record);
}

function withScriptLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function newId_(prefix) {
  return `${prefix}_${Utilities.getUuid().replace(/-/g, '').slice(0, 20)}`;
}

function nowIso_() {
  return Utilities.formatDate(new Date(), 'America/Sao_Paulo', "yyyy-MM-dd'T'HH:mm:ss");
}

function normalizeCellValue_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, 'America/Sao_Paulo', "yyyy-MM-dd'T'HH:mm:ss");
  }
  return value;
}

function serializeCellValue_(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

function parseJsonCell_(value, fallback) {
  if (value === '' || value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch (error) {
    return fallback;
  }
}

function audit_(session, action, entity, entityId, data) {
  appendRecord_('AUDITORIA', {
    ID: newId_('aud'),
    DATA_HORA: nowIso_(),
    USUARIO_ID: session ? session.userId : 'sistema',
    ACAO: action,
    ENTIDADE: entity,
    ENTIDADE_ID: entityId || '',
    DADOS_JSON: data || {}
  });
}
