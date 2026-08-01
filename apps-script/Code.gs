/**
 * Entrada HTTP do backend.
 * Publique como aplicativo da web executando como o proprietário do script.
 */

function doGet(event) {
  try {
    const action = String((event && event.parameter && event.parameter.action) || 'health');
    const payload = event && event.parameter ? event.parameter : {};
    return jsonResponse_({ ok: true, data: dispatch_(action, payload, payload.token || '') });
  } catch (error) {
    return jsonResponse_({ ok: false, error: error.message || String(error) });
  }
}

function doPost(event) {
  try {
    const request = parseRequest_(event);
    const data = dispatch_(request.action, request.payload, request.token);
    return jsonResponse_({ ok: true, data });
  } catch (error) {
    console.error(error.stack || error);
    return jsonResponse_({ ok: false, error: error.message || String(error) });
  }
}

function dispatch_(action, payload, token) {
  const publicActions = {
    health: () => health_(),
    login: () => login_(payload)
  };
  if (publicActions[action]) return publicActions[action]();

  const session = requireSession_(token);
  const protectedActions = {
    bootstrap: () => bootstrap_(session),
    logout: () => logout_(token),
    dashboard: () => getDashboard_(payload, session),
    listAttendance: () => listAttendance_(payload, session),
    saveAttendance: () => saveAttendance_(payload, session),
    attendanceSummary: () => attendanceSummary_(payload, session)
  };

  if (!protectedActions[action]) throw new Error(`Ação desconhecida: ${action}`);
  return protectedActions[action]();
}

function parseRequest_(event) {
  const raw = event && event.postData && event.postData.contents
    ? event.postData.contents
    : '{}';
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error('Corpo da requisição inválido. Envie JSON.');
  }

  return {
    action: String(parsed.action || ''),
    token: String(parsed.token || ''),
    payload: parsed.payload && typeof parsed.payload === 'object' ? parsed.payload : {}
  };
}

function health_() {
  return {
    service: 'Portal Escolar Integrado API',
    status: 'online',
    version: '1.0.0',
    time: nowIso_()
  };
}

function bootstrap_(session) {
  const config = listRecords_('CONFIGURACAO').reduce((result, item) => {
    result[item.CHAVE] = item.VALOR;
    return result;
  }, {});

  return {
    user: {
      id: session.userId,
      name: session.name,
      username: session.username,
      role: session.role
    },
    config,
    attendanceStatuses: attendanceCatalog_(),
    classes: listRecords_('TURMAS')
      .filter(item => String(item.ATIVA).toUpperCase() !== 'FALSE')
      .map(item => ({
        id: item.ID,
        name: item.NOME,
        grade: item.SERIE,
        shift: item.TURNO,
        year: item.ANO
      }))
  };
}

function jsonResponse_(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
