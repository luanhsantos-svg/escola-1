/** Indicadores iniciais do dashboard. */

function getDashboard_(payload, session) {
  const classId = String(payload.classId || '');
  const students = listRecords_('ALUNOS').filter(item => (
    String(item.ATIVO).toUpperCase() !== 'FALSE' &&
    (!classId || String(item.TURMA_ID) === classId)
  ));
  const studentIds = new Set(students.map(item => String(item.ID)));
  const attendance = listRecords_('FREQUENCIA').filter(item => studentIds.has(String(item.ALUNO_ID)));
  const results = listRecords_('RESULTADOS').filter(item => studentIds.has(String(item.ALUNO_ID)));
  const validScores = results
    .filter(item => String(item.AUSENTE).toUpperCase() !== 'TRUE')
    .map(item => Number(item.NOTA_PERCENTUAL))
    .filter(Number.isFinite);
  const attendanceSummary = attendanceSummaryFromRecords_(attendance);

  return {
    generatedAt: nowIso_(),
    filters: { classId: classId || null },
    kpis: {
      students: students.length,
      performanceAverage: validScores.length
        ? round2_(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
        : 0,
      attendanceRate: attendanceSummary.presenceRate,
      totalAbsences: attendanceSummary.absenceTotal,
      unjustifiedAbsences: attendanceSummary.counts.F
    },
    attendance: attendanceSummary,
    alerts: buildDashboardAlerts_(students, attendance, results)
  };
}

function buildDashboardAlerts_(students, attendance, results) {
  const alerts = [];
  const attendanceByStudent = groupBy_(attendance, item => String(item.ALUNO_ID));
  const resultsByStudent = groupBy_(results, item => String(item.ALUNO_ID));

  students.forEach(student => {
    const studentAttendance = attendanceSummaryFromRecords_(attendanceByStudent[String(student.ID)] || []);
    const scores = (resultsByStudent[String(student.ID)] || [])
      .filter(item => String(item.AUSENTE).toUpperCase() !== 'TRUE')
      .map(item => Number(item.NOTA_PERCENTUAL))
      .filter(Number.isFinite);
    const performance = scores.length
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : null;

    if (studentAttendance.total && studentAttendance.presenceRate < 80) {
      alerts.push({
        type: 'attendance-critical',
        studentId: student.ID,
        studentName: student.NOME,
        value: studentAttendance.presenceRate,
        message: 'Frequência abaixo de 80%.'
      });
    } else if (studentAttendance.total && studentAttendance.presenceRate < 85) {
      alerts.push({
        type: 'attendance-warning',
        studentId: student.ID,
        studentName: student.NOME,
        value: studentAttendance.presenceRate,
        message: 'Frequência entre 80% e 85%.'
      });
    }

    if (performance !== null && performance < 50) {
      alerts.push({
        type: 'performance-critical',
        studentId: student.ID,
        studentName: student.NOME,
        value: round2_(performance),
        message: 'Desempenho abaixo da meta mínima de 50%.'
      });
    }
  });

  return alerts.sort((a, b) => Number(a.value) - Number(b.value)).slice(0, 50);
}

function groupBy_(items, keyFn) {
  return items.reduce((result, item) => {
    const key = keyFn(item);
    if (!result[key]) result[key] = [];
    result[key].push(item);
    return result;
  }, {});
}
