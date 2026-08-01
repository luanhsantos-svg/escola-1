/** Módulo de frequência escolar. */

const ATTENDANCE_STATUSES = {
  P: { label: 'Presente', countsAsPresence: true, requiresNote: false },
  F: { label: 'Falta', countsAsPresence: false, requiresNote: false },
  J: { label: 'Justificada', countsAsPresence: false, requiresNote: true },
  AT: { label: 'Atestado', countsAsPresence: false, requiresNote: true },
  JR: { label: 'Justificada pelo responsável', countsAsPresence: false, requiresNote: true },
  A: { label: 'Atraso', countsAsPresence: true, requiresNote: false }
};

function attendanceCatalog_() {
  return Object.keys(ATTENDANCE_STATUSES).map(code => ({
    code,
    ...ATTENDANCE_STATUSES[code]
  }));
}

function listAttendance_(payload, session) {
  const date = String(payload.date || '');
  const classId = String(payload.classId || '');
  if (!date || !classId) throw new Error('Informe data e turma.');

  const students = listRecords_('ALUNOS')
    .filter(item => String(item.TURMA_ID) === classId && String(item.ATIVO).toUpperCase() !== 'FALSE');
  const records = listRecords_('FREQUENCIA')
    .filter(item => String(item.DATA).slice(0, 10) === date && String(item.TURMA_ID) === classId);
  const byStudent = new Map(records.map(item => [String(item.ALUNO_ID), item]));

  return {
    date,
    classId,
    statuses: attendanceCatalog_(),
    students: students.map(student => {
      const record = byStudent.get(String(student.ID));
      return {
        id: student.ID,
        ra: student.RA,
        name: student.NOME,
        status: record ? record.STATUS : 'P',
        note: record ? record.OBSERVACAO : ''
      };
    }),
    summary: attendanceSummaryFromRecords_(records)
  };
}

function saveAttendance_(payload, session) {
  requireRole_(session, ['admin', 'teacher']);
  const date = String(payload.date || '');
  const classId = String(payload.classId || '');
  const entries = Array.isArray(payload.entries) ? payload.entries : [];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Data inválida.');
  if (!classId) throw new Error('Turma não informada.');
  if (!entries.length) throw new Error('Nenhum lançamento recebido.');

  const students = listRecords_('ALUNOS')
    .filter(item => String(item.TURMA_ID) === classId && String(item.ATIVO).toUpperCase() !== 'FALSE');
  const validStudentIds = new Set(students.map(item => String(item.ID)));
  const existing = listRecords_('FREQUENCIA')
    .filter(item => String(item.DATA).slice(0, 10) === date && String(item.TURMA_ID) === classId);
  const existingByStudent = new Map(existing.map(item => [String(item.ALUNO_ID), item]));

  const saved = withScriptLock_(() => entries.map(entry => {
    const studentId = String(entry.studentId || '');
    const status = String(entry.status || '').toUpperCase();
    const note = String(entry.note || '').trim();

    if (!validStudentIds.has(studentId)) throw new Error(`Aluno inválido: ${studentId}`);
    if (!ATTENDANCE_STATUSES[status]) throw new Error(`Status inválido para o aluno ${studentId}.`);
    if (ATTENDANCE_STATUSES[status].requiresNote && !note) {
      throw new Error(`Informe a justificativa do aluno ${studentId}.`);
    }

    const previous = existingByStudent.get(studentId);
    const record = {
      ID: previous ? previous.ID : newId_('freq'),
      DATA: date,
      TURMA_ID: classId,
      ALUNO_ID: studentId,
      STATUS: status,
      OBSERVACAO: note,
      REGISTRADO_POR: session.userId,
      REGISTRADO_EM: nowIso_()
    };
    upsertRecordById_('FREQUENCIA', record);
    return record;
  }));

  audit_(session, 'SALVAR_FREQUENCIA', 'TURMA', classId, {
    date,
    total: saved.length,
    summary: attendanceSummaryFromRecords_(saved)
  });

  return {
    success: true,
    saved: saved.length,
    summary: attendanceSummaryFromRecords_(saved)
  };
}

function attendanceSummary_(payload, session) {
  const records = listRecords_('FREQUENCIA').filter(item => {
    const dateMatches = !payload.date || String(item.DATA).slice(0, 10) === String(payload.date);
    const classMatches = !payload.classId || String(item.TURMA_ID) === String(payload.classId);
    const studentMatches = !payload.studentId || String(item.ALUNO_ID) === String(payload.studentId);
    return dateMatches && classMatches && studentMatches;
  });
  return attendanceSummaryFromRecords_(records);
}

function attendanceSummaryFromRecords_(records) {
  const counts = Object.keys(ATTENDANCE_STATUSES).reduce((result, code) => {
    result[code] = 0;
    return result;
  }, {});

  records.forEach(record => {
    const status = String(record.STATUS || '').toUpperCase();
    if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1;
  });

  const total = records.length;
  const presenceTotal = counts.P + counts.A;
  const justifiedTotal = counts.J + counts.AT + counts.JR;
  const absenceTotal = counts.F + justifiedTotal;

  return {
    total,
    counts,
    presenceTotal,
    absenceTotal,
    justifiedTotal,
    presenceRate: total ? round2_((presenceTotal / total) * 100) : 100,
    absenceRate: total ? round2_((absenceTotal / total) * 100) : 0
  };
}

function round2_(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
