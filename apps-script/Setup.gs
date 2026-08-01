/** Criação inicial das abas e dados básicos. */

const PORTAL_SCHEMA = {
  CONFIGURACAO: ['CHAVE', 'VALOR'],
  USUARIOS: ['ID', 'NOME', 'USUARIO', 'SENHA_HASH', 'SALT', 'PERFIL', 'ATIVO', 'CRIADO_EM', 'ULTIMO_ACESSO'],
  TURMAS: ['ID', 'NOME', 'SERIE', 'TURNO', 'ANO', 'ATIVA'],
  ALUNOS: ['ID', 'RA', 'NOME', 'TURMA_ID', 'ATIVO', 'RESPONSAVEL', 'TELEFONE', 'EMAIL'],
  SIMULADOS: ['ID', 'TITULO', 'DATA', 'TURMA_ID', 'DISCIPLINAS_JSON', 'GABARITO_JSON', 'PESO', 'ATIVO'],
  RESULTADOS: ['ID', 'SIMULADO_ID', 'ALUNO_ID', 'RESPOSTAS_JSON', 'AUSENTE', 'NOTA_PERCENTUAL', 'CRIADO_EM'],
  FREQUENCIA: ['ID', 'DATA', 'TURMA_ID', 'ALUNO_ID', 'STATUS', 'OBSERVACAO', 'REGISTRADO_POR', 'REGISTRADO_EM'],
  METAS: ['ID', 'ALUNO_ID', 'BIMESTRE', 'META_PERCENTUAL', 'OBSERVACAO', 'CRIADO_EM'],
  AUDITORIA: ['ID', 'DATA_HORA', 'USUARIO_ID', 'ACAO', 'ENTIDADE', 'ENTIDADE_ID', 'DADOS_JSON']
};

function setupSystem() {
  const spreadsheet = getSpreadsheet_();
  Object.keys(PORTAL_SCHEMA).forEach(sheetName => {
    ensureSheet_(spreadsheet, sheetName, PORTAL_SCHEMA[sheetName]);
  });

  seedConfiguration_();
  const admin = seedAdministrator_();
  SpreadsheetApp.flush();

  const result = {
    success: true,
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    adminUsername: admin.username,
    temporaryPassword: admin.temporaryPassword || null,
    message: admin.temporaryPassword
      ? 'Sistema criado. Guarde a senha temporária e altere-a após o primeiro acesso.'
      : 'Sistema já estava configurado; nenhum novo administrador foi criado.'
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}

function ensureSheet_(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    const existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0].map(String);
    const differs = headers.some((header, index) => existingHeaders[index] !== header);
    if (differs) {
      throw new Error(`A aba ${sheetName} possui cabeçalhos incompatíveis. Faça backup antes de corrigir.`);
    }
  }

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#0f2f57')
    .setFontColor('#ffffff');
  sheet.autoResizeColumns(1, headers.length);
}

function seedConfiguration_() {
  const current = listRecords_('CONFIGURACAO');
  const defaults = {
    ESCOLA_NOME: 'E.E. Laura de Mello Franco',
    SUBTITULO: 'Gestão pedagógica integrada',
    META_MINIMA: 50,
    FREQUENCIA_ATENCAO: 85,
    FREQUENCIA_CRITICA: 80,
    TEMA: 'light',
    COR_PRINCIPAL: '#1769e0',
    VERSAO: '1.0.0'
  };

  Object.entries(defaults).forEach(([key, value]) => {
    if (!current.some(item => item.CHAVE === key)) {
      appendRecord_('CONFIGURACAO', { CHAVE: key, VALOR: value });
    }
  });
}

function seedAdministrator_() {
  const users = listRecords_('USUARIOS');
  if (users.length) return { username: users[0].USUARIO, temporaryPassword: null };

  const temporaryPassword = `Portal@${Utilities.getUuid().replace(/-/g, '').slice(0, 8)}`;
  const passwordRecord = createPasswordRecord_(temporaryPassword);
  appendRecord_('USUARIOS', {
    ID: newId_('usr'),
    NOME: 'Administrador',
    USUARIO: 'admin',
    SENHA_HASH: passwordRecord.hash,
    SALT: passwordRecord.salt,
    PERFIL: 'admin',
    ATIVO: true,
    CRIADO_EM: nowIso_(),
    ULTIMO_ACESSO: ''
  });

  return { username: 'admin', temporaryPassword };
}
