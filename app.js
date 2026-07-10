(() => {
  "use strict";

  const STORAGE_KEY = "portal_escolar_integrado_v1";
  const SESSION_KEY = "portal_escolar_session_v1";
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const uid = (prefix = "id") => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const esc = (value = "") => String(value).replace(/[&<>'"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[ch]));
  const fmtDate = value => value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)) : "—";
  const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, Number(n) || 0));
  const percent = n => `${Math.round(Number(n) || 0)}%`;
  const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

  const seedState = () => ({
    version: 1,
    config: {
      schoolName: "E.E. Laura de Mello Franco",
      subtitle: "Gestão pedagógica integrada",
      logo: "",
      theme: "dark",
      accent: "#5b5ce2",
      entryTime: "07:00",
      minimumGoal: 50
    },
    users: [
      { id: "usr_admin", username: "admin", password: "admin123", name: "Administrador", role: "admin" },
      { id: "usr_prof", username: "professor", password: "prof123", name: "Professor", role: "teacher" },
      { id: "usr_view", username: "consulta", password: "consulta123", name: "Consulta", role: "viewer" }
    ],
    classes: [
      { id: "cls_8a", name: "8º A", grade: "8º ano", shift: "Manhã", year: 2026 },
      { id: "cls_9a", name: "9º A", grade: "9º ano", shift: "Manhã", year: 2026 },
      { id: "cls_9b", name: "9º B", grade: "9º ano", shift: "Manhã", year: 2026 },
      { id: "cls_1a", name: "1ª A", grade: "Ensino Médio", shift: "Manhã", year: 2026 }
    ],
    students: [
      { id: "stu_1", classId: "cls_8a", ra: "000001", name: "Aluno Exemplo 01", active: true },
      { id: "stu_2", classId: "cls_8a", ra: "000002", name: "Aluna Exemplo 02", active: true },
      { id: "stu_3", classId: "cls_9a", ra: "000003", name: "Aluno Exemplo 03", active: true },
      { id: "stu_4", classId: "cls_9b", ra: "000004", name: "Aluna Exemplo 04", active: true },
      { id: "stu_5", classId: "cls_1a", ra: "000005", name: "Aluno Exemplo 05", active: true }
    ],
    assessments: [
      { id: "ass_1", title: "Simulado Diagnóstico", date: todayISO(), classId: "cls_8a", disciplines: [{ name: "Ciências", questions: 2 }], answerKey: ["A", "C"] }
    ],
    results: [
      { id: "res_1", assessmentId: "ass_1", studentId: "stu_1", answers: ["A", "C"], absent: false },
      { id: "res_2", assessmentId: "ass_1", studentId: "stu_2", answers: ["A", "B"], absent: false }
    ],
    attendance: [
      { id: "att_1", date: todayISO(), classId: "cls_8a", studentId: "stu_1", status: "P", note: "" },
      { id: "att_2", date: todayISO(), classId: "cls_8a", studentId: "stu_2", status: "F", note: "" }
    ]
  });

  let state = loadState();
  let currentPage = "dashboard";
  let currentUser = null;
  let currentAttendanceDraft = {};
  let reportStudentId = "";

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const pageContainer = $("#page-container");

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...seedState(), ...JSON.parse(stored) } : seedState();
    } catch (error) {
      console.error(error);
      return seedState();
    }
  }

  function saveState(message = "") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    applyBrand();
    updateStorageMeter();
    if (message) toast(message);
  }

  function roleLabel(role) {
    return { admin: "Administrador", teacher: "Professor", viewer: "Consulta" }[role] || role;
  }

  function canWrite() { return currentUser && currentUser.role !== "viewer"; }
  function isAdmin() { return currentUser?.role === "admin"; }

  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("show"), 2800);
  }

  function setAccent(hex) {
    state.config.accent = hex;
    const parsed = hex.replace("#", "");
    const rgb = parsed.length === 3
      ? parsed.split("").map(c => parseInt(c + c, 16))
      : [parseInt(parsed.slice(0, 2), 16), parseInt(parsed.slice(2, 4), 16), parseInt(parsed.slice(4, 6), 16)];
    document.documentElement.style.setProperty("--accent", hex);
    document.documentElement.style.setProperty("--accent-rgb", rgb.join(","));
  }

  function applyBrand() {
    document.documentElement.dataset.theme = state.config.theme;
    setAccent(state.config.accent || "#5b5ce2");
    $("#sidebar-school").textContent = state.config.schoolName || "Portal Escolar";
    $("#sidebar-subtitle").textContent = state.config.subtitle || "Gestão integrada";
    $("#theme-toggle").textContent = state.config.theme === "dark" ? "☀" : "☾";
    const logo = $("#sidebar-logo");
    logo.innerHTML = state.config.logo ? `<img src="${state.config.logo}" alt="Logo da escola">` : initials(state.config.schoolName || "Portal Escolar");
  }

  function initials(name) {
    return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase() || "PE";
  }

  function updateStorageMeter() {
    const bytes = new Blob([JSON.stringify(state)]).size;
    const kb = Math.max(1, Math.round(bytes / 1024));
    $("#storage-label").textContent = `${kb} KB`;
    $("#storage-bar").style.width = `${Math.min(100, (bytes / (4.5 * 1024 * 1024)) * 100)}%`;
  }

  function classById(id) { return state.classes.find(item => item.id === id); }
  function studentById(id) { return state.students.find(item => item.id === id); }
  function assessmentById(id) { return state.assessments.find(item => item.id === id); }
  function activeStudents(classId = "") { return state.students.filter(s => s.active !== false && (!classId || s.classId === classId)); }

  function resultScore(result, assessment) {
    if (!result || result.absent || !assessment?.answerKey?.length) return null;
    const correct = assessment.answerKey.reduce((sum, key, index) => sum + (normalize(result.answers?.[index]).toUpperCase() === normalize(key).toUpperCase() ? 1 : 0), 0);
    return (correct / assessment.answerKey.length) * 100;
  }

  function assessmentStats(assessment) {
    const results = state.results.filter(r => r.assessmentId === assessment.id);
    const valid = results.filter(r => !r.absent).map(r => resultScore(r, assessment)).filter(v => v !== null);
    const totalStudents = activeStudents(assessment.classId).length;
    return {
      average: valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0,
      participation: totalStudents ? (results.filter(r => !r.absent).length / totalStudents) * 100 : 0,
      absent: results.filter(r => r.absent).length,
      launched: results.length
    };
  }

  function studentPerformance(studentId) {
    const scores = state.results
      .filter(r => r.studentId === studentId && !r.absent)
      .map(r => resultScore(r, assessmentById(r.assessmentId)))
      .filter(v => v !== null);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }

  function studentAttendance(studentId) {
    const records = state.attendance.filter(a => a.studentId === studentId);
    if (!records.length) return 100;
    const presentEquivalent = records.filter(a => ["P", "A"].includes(a.status)).length;
    return (presentEquivalent / records.length) * 100;
  }

  function globalAttendance() {
    if (!state.attendance.length) return 100;
    return (state.attendance.filter(a => ["P", "A"].includes(a.status)).length / state.attendance.length) * 100;
  }

  function globalPerformance() {
    const scores = state.results.map(r => resultScore(r, assessmentById(r.assessmentId))).filter(v => v !== null);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }

  function todayAbsences() {
    return state.attendance.filter(a => a.date === todayISO() && a.status === "F").length;
  }

  function statusBadge(value) {
    if (value >= 80) return `<span class="badge success">Adequado</span>`;
    if (value >= 50) return `<span class="badge warning">Atenção</span>`;
    return `<span class="badge danger">Crítico</span>`;
  }

  function pageMeta(page) {
    return {
      dashboard: ["PAINEL", "Visão geral"],
      turmas: ["CADASTROS", "Turmas e alunos"],
      simulados: ["AVALIAÇÃO", "BI de simulados"],
      frequencia: ["PRESENÇA", "Controle de frequência"],
      busca: ["INTERVENÇÃO", "Busca ativa"],
      relatorios: ["ANÁLISE", "Relatórios pedagógicos"],
      configuracoes: ["SISTEMA", "Configurações"]
    }[page];
  }

  function navigate(page) {
    if (page === "configuracoes" && !isAdmin()) page = "dashboard";
    currentPage = page;
    const [eyebrow, title] = pageMeta(page);
    $("#page-eyebrow").textContent = eyebrow;
    $("#page-title").textContent = title;
    $$(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.page === page));
    $(".sidebar").classList.remove("open");
    renderPage();
  }

  function renderPage() {
    const renderers = {
      dashboard: renderDashboard,
      turmas: renderClasses,
      simulados: renderAssessments,
      frequencia: renderAttendance,
      busca: renderActiveSearch,
      relatorios: renderReports,
      configuracoes: renderSettings
    };
    renderers[currentPage]?.();
  }

  function renderDashboard() {
    const perf = globalPerformance();
    const att = globalAttendance();
    const recent = [...state.assessments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    const classRows = state.classes.map(cls => {
      const students = activeStudents(cls.id);
      const scores = students.map(s => studentPerformance(s.id));
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const freq = students.length ? students.reduce((sum, s) => sum + studentAttendance(s.id), 0) / students.length : 100;
      return { cls, students: students.length, avg, freq };
    });

    pageContainer.innerHTML = `
      <div class="page-head">
        <div><h2>Acompanhamento em tempo real</h2><p>Resumo dos principais indicadores pedagógicos da escola.</p></div>
        <div class="actions">
          ${canWrite() ? `<button class="btn" data-action="open-attendance">Lançar frequência</button><button class="btn btn-primary" data-action="new-assessment">Novo simulado</button>` : ""}
        </div>
      </div>
      <div class="grid grid-4">
        ${statCard("Alunos ativos", activeStudents().length, `${state.classes.length} turmas cadastradas`, "♙")}
        ${statCard("Frequência geral", percent(att), att >= 85 ? "Dentro da meta" : "Requer intervenção", "◷", att >= 85 ? "success" : "warning")}
        ${statCard("Desempenho médio", percent(perf), `${state.assessments.length} simulados cadastrados`, "✓", perf >= 50 ? "success" : "danger")}
        ${statCard("Faltas hoje", todayAbsences(), todayAbsences() ? "Alunos para busca ativa" : "Nenhuma falta registrada", "!", todayAbsences() ? "danger" : "success")}
      </div>

      <div class="grid grid-2" style="margin-top:16px">
        <section class="card">
          <div class="card-header"><div><h3 class="section-title">Desempenho por turma</h3><span class="section-subtitle">Média dos resultados lançados</span></div><button class="btn btn-sm btn-ghost" data-page-link="simulados">Ver BI</button></div>
          <div class="card-body">
            ${classRows.length ? classRows.map(row => progressRow(row.cls.name, row.avg)).join("") : emptyInline("Cadastre turmas para começar.")}
          </div>
        </section>
        <section class="card">
          <div class="card-header"><div><h3 class="section-title">Frequência por turma</h3><span class="section-subtitle">Presença acumulada</span></div><button class="btn btn-sm btn-ghost" data-page-link="frequencia">Abrir frequência</button></div>
          <div class="card-body">
            ${classRows.length ? classRows.map(row => progressRow(row.cls.name, row.freq)).join("") : emptyInline("Sem registros de frequência.")}
          </div>
        </section>
      </div>

      <div class="grid grid-2" style="margin-top:16px">
        <section class="card">
          <div class="card-header"><div><h3 class="section-title">Simulados recentes</h3><span class="section-subtitle">Últimos lançamentos</span></div></div>
          <div class="table-wrap"><table><thead><tr><th>Simulado</th><th>Turma</th><th>Data</th><th>Média</th></tr></thead><tbody>
            ${recent.length ? recent.map(a => `<tr><td><strong>${esc(a.title)}</strong></td><td>${esc(classById(a.classId)?.name || "—")}</td><td>${fmtDate(a.date)}</td><td>${statusBadge(assessmentStats(a).average)} <strong>${percent(assessmentStats(a).average)}</strong></td></tr>`).join("") : `<tr><td colspan="4">Nenhum simulado cadastrado.</td></tr>`}
          </tbody></table></div>
        </section>
        <section class="card">
          <div class="card-header"><div><h3 class="section-title">Alertas pedagógicos</h3><span class="section-subtitle">Prioridades calculadas automaticamente</span></div></div>
          <div class="card-body insight-list">${buildAlerts()}</div>
        </section>
      </div>`;
  }

  function statCard(label, value, helper, icon, tone = "") {
    return `<article class="card stat-card"><div><span class="stat-label">${label}</span><strong>${value}</strong><small>${helper}</small></div><span class="stat-icon ${tone}">${icon}</span></article>`;
  }

  function progressRow(label, value) {
    const tone = value >= 80 ? "success" : value >= 50 ? "warning" : "danger";
    return `<div class="progress-row"><strong>${esc(label)}</strong><div class="progress"><span class="${tone}" style="width:${clamp(value)}%"></span></div><b>${percent(value)}</b></div>`;
  }

  function emptyInline(text) { return `<p class="text-muted">${esc(text)}</p>`; }

  function buildAlerts() {
    const alerts = [];
    const lowAttendance = activeStudents().filter(s => studentAttendance(s.id) < 80).sort((a, b) => studentAttendance(a.id) - studentAttendance(b.id));
    const lowPerformance = activeStudents().filter(s => studentPerformance(s.id) > 0 && studentPerformance(s.id) < 50).sort((a, b) => studentPerformance(a.id) - studentPerformance(b.id));
    if (todayAbsences()) alerts.push(insight("!", "Busca ativa pendente", `${todayAbsences()} falta(s) registrada(s) hoje.`));
    if (lowAttendance.length) alerts.push(insight("◷", "Frequência crítica", `${lowAttendance.length} aluno(s) abaixo de 80% de presença.`));
    if (lowPerformance.length) alerts.push(insight("↗", "Aprendizagem em atenção", `${lowPerformance.length} aluno(s) abaixo de 50% nos simulados.`));
    if (!alerts.length) alerts.push(insight("✓", "Indicadores estáveis", "Não há alertas críticos com os dados atuais."));
    return alerts.join("");
  }

  function insight(icon, title, text) {
    return `<div class="insight"><span>${icon}</span><div><strong>${title}</strong><p>${text}</p></div></div>`;
  }

  function renderClasses() {
    const cards = state.classes.map(cls => {
      const students = activeStudents(cls.id);
      return `<article class="card class-card">
        <div class="class-card-head"><div><h3>${esc(cls.name)}</h3><span class="text-muted">${esc(cls.grade || "Turma")}</span></div><span class="badge info">${students.length} alunos</span></div>
        <div class="class-meta"><span class="badge">${esc(cls.shift || "—")}</span><span class="badge">${esc(cls.year || "—")}</span></div>
        <div class="class-footer"><span class="text-muted">Frequência: <strong>${percent(students.length ? students.reduce((sum, s) => sum + studentAttendance(s.id), 0) / students.length : 100)}</strong></span><button class="btn btn-sm" data-action="view-class" data-id="${cls.id}">Abrir turma</button></div>
      </article>`;
    }).join("");
    pageContainer.innerHTML = `
      <div class="page-head"><div><h2>Turmas e estudantes</h2><p>Cadastre manualmente ou importe uma planilha com RA, nome e turma.</p></div>
        <div class="actions">${canWrite() ? `<button class="btn" data-action="import-students">Importar planilha</button><button class="btn btn-primary" data-action="new-class">Nova turma</button>` : ""}</div>
      </div>
      <div class="grid grid-3">${cards || emptyState("♙", "Nenhuma turma cadastrada", "Crie a primeira turma para começar.")}</div>`;
  }

  function renderAssessments() {
    const cards = [...state.assessments].sort((a, b) => b.date.localeCompare(a.date)).map(a => {
      const stats = assessmentStats(a);
      return `<article class="card assessment-card">
        <div class="assessment-top"><div><span class="eyebrow">${fmtDate(a.date)}</span><h3>${esc(a.title)}</h3><span class="text-muted">${esc(classById(a.classId)?.name || "Turma removida")} · ${a.answerKey.length} questões</span></div>${statusBadge(stats.average)}</div>
        <div class="assessment-kpis"><div class="mini-kpi"><span>Média</span><strong>${percent(stats.average)}</strong></div><div class="mini-kpi"><span>Participação</span><strong>${percent(stats.participation)}</strong></div><div class="mini-kpi"><span>Faltas</span><strong>${stats.absent}</strong></div></div>
        <div class="actions"><button class="btn btn-sm" data-action="assessment-details" data-id="${a.id}">Ver análise</button>${canWrite() ? `<button class="btn btn-sm btn-primary" data-action="launch-results" data-id="${a.id}">Lançar resultados</button><button class="btn btn-sm btn-danger" data-action="delete-assessment" data-id="${a.id}">Excluir</button>` : ""}</div>
      </article>`;
    }).join("");
    pageContainer.innerHTML = `
      <div class="page-head"><div><h2>BI de simulados</h2><p>Configure questões, gabaritos e acompanhe a evolução de cada turma.</p></div>
        <div class="actions">${canWrite() ? `<button class="btn btn-primary" data-action="new-assessment">Novo simulado</button>` : ""}</div>
      </div>
      <div class="filter-bar"><label>Turma<select id="assessment-class-filter"><option value="">Todas</option>${classOptions()}</select></label><label>Busca<input id="assessment-search" placeholder="Nome do simulado"></label><div></div><div></div></div>
      <div id="assessment-grid" class="grid grid-3">${cards || emptyState("✓", "Nenhum simulado", "Crie um simulado e informe o gabarito.")}</div>`;
  }

  function renderAttendance() {
    const selectedClass = state.classes[0]?.id || "";
    const selectedDate = todayISO();
    pageContainer.innerHTML = `
      <div class="page-head"><div><h2>Registro de frequência</h2><p>Marque P (presente), F (falta), J (justificada) ou A (atraso).</p></div><div class="actions"><button class="btn" data-action="attendance-summary">Resumo</button>${canWrite() ? `<button class="btn btn-success" data-action="save-attendance">Salvar frequência</button>` : ""}</div></div>
      <div class="filter-bar"><label>Data<input id="attendance-date" type="date" value="${selectedDate}"></label><label>Turma<select id="attendance-class">${classOptions(selectedClass)}</select></label><label>Filtro<input id="attendance-search" placeholder="Nome ou RA"></label><label>Atalhos<select id="attendance-bulk" ${canWrite() ? "" : "disabled"}><option value="">Aplicar a todos...</option><option value="P">Todos presentes</option><option value="F">Todos faltaram</option></select></label></div>
      <div id="attendance-panel"></div>`;
    loadAttendanceDraft();
  }

  function loadAttendanceDraft() {
    const date = $("#attendance-date")?.value;
    const classId = $("#attendance-class")?.value;
    const students = activeStudents(classId);
    currentAttendanceDraft = {};
    students.forEach(s => {
      const record = state.attendance.find(a => a.date === date && a.classId === classId && a.studentId === s.id);
      currentAttendanceDraft[s.id] = record?.status || "P";
    });
    renderAttendanceRows();
  }

  function renderAttendanceRows() {
    const classId = $("#attendance-class")?.value;
    const search = normalize($("#attendance-search")?.value);
    const students = activeStudents(classId).filter(s => !search || normalize(`${s.name} ${s.ra}`).includes(search));
    const panel = $("#attendance-panel");
    if (!panel) return;
    panel.innerHTML = students.length ? `<div class="attendance-list">${students.map(s => attendanceRow(s)).join("")}</div>` : emptyState("◷", "Nenhum aluno encontrado", "Cadastre ou importe estudantes para esta turma.");
  }

  function attendanceRow(student) {
    const current = currentAttendanceDraft[student.id] || "P";
    return `<div class="attendance-row"><div class="student-id"><span class="avatar">${initials(student.name)}</span><div><strong>${esc(student.name)}</strong><small>RA ${esc(student.ra || "não informado")}</small></div></div><div class="status-group">${["P", "F", "J", "A"].map(status => `<button class="status-btn ${current === status ? "active" : ""}" data-action="set-status" data-student="${student.id}" data-status="${status}" ${canWrite() ? "" : "disabled"} title="${{P:"Presente",F:"Falta",J:"Justificada",A:"Atraso"}[status]}">${status}</button>`).join("")}</div></div>`;
  }

  function saveAttendance() {
    const date = $("#attendance-date").value;
    const classId = $("#attendance-class").value;
    if (!date || !classId) return toast("Selecione a data e a turma.");
    Object.entries(currentAttendanceDraft).forEach(([studentId, status]) => {
      const existing = state.attendance.find(a => a.date === date && a.classId === classId && a.studentId === studentId);
      if (existing) existing.status = status;
      else state.attendance.push({ id: uid("att"), date, classId, studentId, status, note: "" });
    });
    saveState("Frequência salva com sucesso.");
    renderAttendance();
  }

  function renderActiveSearch() {
    const absentToday = state.attendance.filter(a => a.date === todayISO() && a.status === "F");
    const chronic = activeStudents().map(s => ({ student: s, attendance: studentAttendance(s.id), performance: studentPerformance(s.id) })).filter(x => x.attendance < 85 || (x.performance > 0 && x.performance < 50)).sort((a, b) => a.attendance - b.attendance);
    pageContainer.innerHTML = `
      <div class="page-head"><div><h2>Busca ativa e intervenções</h2><p>Priorize ausências do dia e alunos com indicadores abaixo das metas.</p></div><div class="actions"><button class="btn" data-action="print-page">Imprimir lista</button></div></div>
      <div class="grid grid-2">
        <section class="card"><div class="card-header"><div><h3 class="section-title">Faltas de hoje</h3><span class="section-subtitle">${fmtDate(todayISO())}</span></div><span class="badge ${absentToday.length ? "danger" : "success"}">${absentToday.length}</span></div><div class="card-body">
          ${absentToday.length ? absentToday.map(record => activeAlert(record)).join("") : `<div class="empty-state"><div><div class="empty-icon">✓</div><h3>Nenhuma falta hoje</h3><p>Não há estudantes marcados como faltosos.</p></div></div>`}
        </div></section>
        <section class="card"><div class="card-header"><div><h3 class="section-title">Acompanhamento prioritário</h3><span class="section-subtitle">Frequência &lt;85% ou desempenho &lt;50%</span></div><span class="badge warning">${chronic.length}</span></div><div class="card-body insight-list">
          ${chronic.length ? chronic.map(item => `<div class="insight"><span>${initials(item.student.name)}</span><div><strong>${esc(item.student.name)} · ${esc(classById(item.student.classId)?.name || "—")}</strong><p>Frequência ${percent(item.attendance)} · Desempenho ${item.performance ? percent(item.performance) : "sem dados"}</p></div></div>`).join("") : insight("✓", "Sem casos prioritários", "Os indicadores cadastrados estão dentro das metas.")}
        </div></section>
      </div>`;
  }

  function activeAlert(record) {
    const student = studentById(record.studentId);
    if (!student) return "";
    return `<article class="card alert-card" style="margin-bottom:10px"><div class="alert-head"><div><h3>${esc(student.name)}</h3><span class="text-muted">${esc(classById(student.classId)?.name || "—")} · RA ${esc(student.ra || "—")}</span></div><span class="badge danger">Falta</span></div><div class="actions" style="margin-top:13px"><button class="btn btn-sm" data-action="student-report" data-id="${student.id}">Ver histórico</button></div></article>`;
  }

  function renderReports() {
    const firstStudent = reportStudentId || activeStudents()[0]?.id || "";
    reportStudentId = firstStudent;
    pageContainer.innerHTML = `
      <div class="page-head"><div><h2>Relatório individual</h2><p>Resumo de desempenho, presença, alertas e próxima meta sugerida.</p></div><div class="actions"><button class="btn" data-action="print-page">Imprimir / PDF</button></div></div>
      <div class="filter-bar"><label>Turma<select id="report-class"><option value="">Todas</option>${classOptions()}</select></label><label>Aluno<select id="report-student">${studentOptions(firstStudent)}</select></label><div></div><div></div></div>
      <div id="report-panel">${renderReportSheet(firstStudent)}</div>`;
  }

  function renderReportSheet(studentId) {
    const student = studentById(studentId);
    if (!student) return emptyState("▤", "Nenhum aluno selecionado", "Cadastre estudantes para gerar relatórios.");
    const performance = studentPerformance(student.id);
    const attendance = studentAttendance(student.id);
    const nextGoal = Math.max(Number(state.config.minimumGoal || 50), Math.min(100, Math.ceil((performance + 10) / 5) * 5));
    const studentResults = state.results.filter(r => r.studentId === student.id).sort((a,b) => assessmentById(b.assessmentId)?.date.localeCompare(assessmentById(a.assessmentId)?.date || "") || 0);
    const insights = [];
    insights.push(insight(performance >= 50 ? "✓" : "!", "Desempenho acadêmico", performance >= 80 ? "Excelente desempenho nos simulados." : performance >= 50 ? "Desempenho em desenvolvimento; manter acompanhamento." : "Necessita retomada de habilidades e intervenção pedagógica."));
    insights.push(insight(attendance >= 85 ? "✓" : "◷", "Frequência escolar", attendance >= 85 ? "Frequência dentro da meta recomendada." : "Frequência abaixo de 85%; encaminhar para busca ativa."));
    insights.push(insight("↗", "Próxima meta sugerida", `Alcançar pelo menos ${nextGoal}% na próxima avaliação. A meta mínima nunca fica abaixo de ${state.config.minimumGoal || 50}%.`));
    return `<section class="report-sheet">
      <div class="report-banner"><span class="eyebrow" style="color:white;opacity:.82">RELATÓRIO PEDAGÓGICO</span><h2>${esc(student.name)}</h2><span>${esc(classById(student.classId)?.name || "—")} · RA ${esc(student.ra || "—")}</span></div>
      <div class="report-body">
        <div class="grid grid-2"><div class="report-score"><div class="score-ring" style="--score:${clamp(performance)}%"><strong>${percent(performance)}</strong></div><div><h3>Desempenho médio</h3><p class="text-muted">Média de todos os simulados respondidos.</p>${statusBadge(performance)}</div></div>
        <div class="report-score"><div class="score-ring" style="--score:${clamp(attendance)}%"><strong>${percent(attendance)}</strong></div><div><h3>Frequência acumulada</h3><p class="text-muted">Presenças e atrasos contabilizados.</p>${attendance >= 85 ? `<span class="badge success">Dentro da meta</span>` : `<span class="badge danger">Busca ativa</span>`}</div></div></div>
        <div class="grid grid-2" style="margin-top:22px"><div><h3>Insights pedagógicos</h3><div class="insight-list">${insights.join("")}</div></div><div><h3>Histórico de simulados</h3><div class="table-wrap"><table><thead><tr><th>Avaliação</th><th>Data</th><th>Resultado</th></tr></thead><tbody>${studentResults.length ? studentResults.map(r => { const a = assessmentById(r.assessmentId); const score = resultScore(r,a); return `<tr><td>${esc(a?.title || "Removido")}</td><td>${fmtDate(a?.date)}</td><td>${r.absent ? `<span class="badge danger">Faltou</span>` : `<strong>${percent(score)}</strong>`}</td></tr>`; }).join("") : `<tr><td colspan="3">Sem resultados lançados.</td></tr>`}</tbody></table></div></div></div>
      </div></section>`;
  }

  function renderSettings() {
    if (!isAdmin()) return navigate("dashboard");
    const palette = ["#5b5ce2", "#0f766e", "#2563eb", "#7c3aed", "#be123c", "#c2410c"];
    pageContainer.innerHTML = `
      <div class="page-head"><div><h2>Configurações do portal</h2><p>Personalize a escola, o tema e faça cópias de segurança.</p></div></div>
      <section class="card">
        <div class="settings-section"><h3>Identidade da escola</h3><div class="form-grid"><div class="full" style="display:flex;gap:18px;align-items:center"><div id="logo-preview" class="logo-preview">${state.config.logo ? `<img src="${state.config.logo}" alt="Logo">` : initials(state.config.schoolName)}</div><label style="flex:1">Logo da escola<input id="school-logo" type="file" accept="image/*"><span class="help">A imagem será salva localmente neste navegador.</span></label></div><label>Nome da escola<input id="school-name" value="${esc(state.config.schoolName)}"></label><label>Subtítulo<input id="school-subtitle" value="${esc(state.config.subtitle)}"></label></div></div>
        <div class="settings-section"><h3>Aparência e regras</h3><div class="form-grid"><label>Tema<select id="setting-theme"><option value="dark" ${state.config.theme === "dark" ? "selected" : ""}>Escuro</option><option value="light" ${state.config.theme === "light" ? "selected" : ""}>Claro</option></select></label><label>Horário de entrada<input id="entry-time" type="time" value="${state.config.entryTime || "07:00"}"></label><label>Meta mínima (%)<input id="minimum-goal" type="number" min="0" max="100" value="${state.config.minimumGoal || 50}"><span class="help">Recomendado: 50% ou mais.</span></label><div><label>Cor principal</label><div class="color-options">${palette.map(c => `<button class="color-dot ${state.config.accent === c ? "active" : ""}" style="background:${c}" data-action="set-accent" data-color="${c}" aria-label="Cor ${c}"></button>`).join("")}</div></div></div></div>
        <div class="settings-section"><h3>Dados e segurança</h3><p class="text-muted">Exporte um backup antes de trocar de aparelho ou limpar o navegador.</p><div class="actions"><button class="btn" data-action="export-backup">Exportar backup</button><button class="btn" data-action="import-backup">Importar backup</button><button class="btn btn-danger" data-action="reset-data">Restaurar dados de demonstração</button></div></div>
        <div class="settings-section"><div class="actions"><button class="btn btn-primary" data-action="save-settings">Salvar configurações</button></div></div>
      </section>`;
  }

  function classOptions(selected = "") {
    return state.classes.map(c => `<option value="${c.id}" ${c.id === selected ? "selected" : ""}>${esc(c.name)}</option>`).join("");
  }

  function studentOptions(selected = "", classId = "") {
    return activeStudents(classId).sort((a,b) => a.name.localeCompare(b.name)).map(s => `<option value="${s.id}" ${s.id === selected ? "selected" : ""}>${esc(s.name)} · ${esc(classById(s.classId)?.name || "—")}</option>`).join("");
  }

  function emptyState(icon, title, text) {
    return `<div class="card empty-state"><div><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${text}</p></div></div>`;
  }

  function openModal({ title, body, footer = "", wide = false, onOpen }) {
    const root = $("#modal-root");
    root.innerHTML = `<div class="modal ${wide ? "wide" : ""}"><div class="modal-header"><h2>${title}</h2><button class="icon-btn" data-close-modal>×</button></div><div class="modal-body">${body}</div>${footer ? `<div class="modal-footer">${footer}</div>` : ""}</div>`;
    root.classList.remove("hidden");
    onOpen?.();
  }

  function closeModal() { $("#modal-root").classList.add("hidden"); $("#modal-root").innerHTML = ""; }

  function newClassModal() {
    openModal({ title: "Cadastrar turma", body: `<form id="class-form" class="form-grid"><label>Nome da turma<input name="name" required placeholder="Ex.: 8º A"></label><label>Etapa / série<input name="grade" placeholder="Ex.: 8º ano"></label><label>Turno<select name="shift"><option>Manhã</option><option>Tarde</option><option>Noite</option><option>Integral</option></select></label><label>Ano letivo<input name="year" type="number" value="${new Date().getFullYear()}"></label></form>`, footer: `<button class="btn" data-close-modal>Cancelar</button><button class="btn btn-primary" data-action="save-class">Salvar turma</button>` });
  }

  function saveClass() {
    const form = $("#class-form");
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    state.classes.push({ id: uid("cls"), name: data.name.trim(), grade: data.grade.trim(), shift: data.shift, year: Number(data.year) });
    saveState("Turma cadastrada."); closeModal(); renderClasses();
  }

  function viewClassModal(classId) {
    const cls = classById(classId);
    const students = activeStudents(classId).sort((a,b) => a.name.localeCompare(b.name));
    openModal({ title: `${esc(cls?.name || "Turma")} · estudantes`, wide: true, body: `${canWrite() ? `<div class="actions" style="margin-bottom:14px"><button class="btn btn-primary" data-action="new-student" data-class="${classId}">Adicionar aluno</button><button class="btn" data-action="import-students" data-class="${classId}">Importar planilha</button></div>` : ""}<div class="table-wrap"><table><thead><tr><th>RA</th><th>Nome</th><th>Frequência</th><th>Desempenho</th>${canWrite() ? `<th></th>` : ""}</tr></thead><tbody>${students.length ? students.map(s => `<tr><td>${esc(s.ra || "—")}</td><td><strong>${esc(s.name)}</strong></td><td>${percent(studentAttendance(s.id))}</td><td>${studentPerformance(s.id) ? percent(studentPerformance(s.id)) : "—"}</td>${canWrite() ? `<td class="text-right"><button class="btn btn-sm btn-danger" data-action="deactivate-student" data-id="${s.id}">Remover</button></td>` : ""}</tr>`).join("") : `<tr><td colspan="5">Nenhum aluno cadastrado.</td></tr>`}</tbody></table></div>` });
  }

  function newStudentModal(classId) {
    openModal({ title: "Adicionar estudante", body: `<form id="student-form" class="form-grid"><label class="full">Turma<select name="classId">${classOptions(classId)}</select></label><label>RA<input name="ra" required></label><label>Nome completo<input name="name" required></label></form>`, footer: `<button class="btn" data-close-modal>Cancelar</button><button class="btn btn-primary" data-action="save-student">Salvar estudante</button>` });
  }

  function saveStudent() {
    const form = $("#student-form"); if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    state.students.push({ id: uid("stu"), classId: data.classId, ra: data.ra.trim(), name: data.name.trim(), active: true });
    saveState("Estudante adicionado."); closeModal(); renderClasses();
  }

  function importStudentsModal(prefClassId = "") {
    openModal({ title: "Importar estudantes por planilha", body: `<div class="form-grid"><label>Turma padrão<select id="import-default-class"><option value="">Usar coluna Turma</option>${classOptions(prefClassId)}</select></label><label>Arquivo CSV ou Excel<input id="student-file" type="file" accept=".csv,.xlsx,.xls" required></label><div class="full"><div class="insight"><span>i</span><div><strong>Colunas aceitas</strong><p>RA, Nome e Turma. Se a coluna Turma não existir, selecione uma turma padrão. Turmas ainda não cadastradas serão criadas automaticamente.</p></div></div></div><div class="full"><button class="btn btn-sm" data-action="download-template">Baixar modelo CSV</button></div></div>`, footer: `<button class="btn" data-close-modal>Cancelar</button><button class="btn btn-primary" data-action="process-student-import">Importar</button>` });
  }

  async function processStudentImport() {
    const file = $("#student-file").files[0];
    const defaultClassId = $("#import-default-class").value;
    if (!file) return toast("Selecione um arquivo.");
    let rows = [];
    try {
      if (/\.csv$/i.test(file.name)) rows = parseCSV(await file.text());
      else {
        if (!window.XLSX) throw new Error("Biblioteca de Excel indisponível. Converta o arquivo para CSV.");
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
      }
      let imported = 0;
      rows.forEach(raw => {
        const mapped = Object.fromEntries(Object.entries(raw).map(([k,v]) => [normalize(k), v]));
        const name = String(mapped.nome || mapped.aluno || mapped.name || "").trim();
        const ra = String(mapped.ra || mapped.registro || mapped.matricula || "").trim();
        let classId = defaultClassId;
        const className = String(mapped.turma || mapped.classe || "").trim();
        if (!classId && className) {
          let cls = state.classes.find(c => normalize(c.name) === normalize(className));
          if (!cls) { cls = { id: uid("cls"), name: className, grade: "", shift: "Manhã", year: new Date().getFullYear() }; state.classes.push(cls); }
          classId = cls.id;
        }
        if (!name || !classId) return;
        const existing = state.students.find(s => (ra && s.ra === ra) || (normalize(s.name) === normalize(name) && s.classId === classId));
        if (existing) { existing.name = name; existing.ra = ra || existing.ra; existing.classId = classId; existing.active = true; }
        else state.students.push({ id: uid("stu"), classId, ra, name, active: true });
        imported++;
      });
      saveState(`${imported} estudante(s) importado(s).`); closeModal(); renderClasses();
    } catch (error) { console.error(error); toast(error.message || "Não foi possível importar o arquivo."); }
  }

  function parseCSV(text) {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];
    const delimiter = lines[0].includes(";") ? ";" : ",";
    const parseLine = line => {
      const out = []; let current = ""; let quoted = false;
      for (let i=0;i<line.length;i++) { const ch=line[i]; if(ch==='"' && line[i+1]==='"'){current+='"';i++;} else if(ch==='"'){quoted=!quoted;} else if(ch===delimiter && !quoted){out.push(current);current="";} else current+=ch; }
      out.push(current); return out;
    };
    const headers = parseLine(lines.shift());
    return lines.map(line => Object.fromEntries(parseLine(line).map((value,index) => [headers[index] || `col_${index}`, value])));
  }

  function downloadTemplate() { downloadText("modelo_alunos.csv", "RA;Nome;Turma\n123456;Nome do Aluno;8º A\n", "text/csv;charset=utf-8"); }

  function newAssessmentModal() {
    if (!state.classes.length) return toast("Cadastre uma turma primeiro.");
    openModal({ title: "Criar simulado", body: `<form id="assessment-form" class="form-grid"><label class="full">Nome do simulado<input name="title" required placeholder="Ex.: Simulado 2º bimestre"></label><label>Data<input name="date" type="date" value="${todayISO()}" required></label><label>Turma<select name="classId">${classOptions()}</select></label><label class="full">Disciplinas e quantidade de questões<input name="disciplines" required value="Ciências:2" placeholder="Ciências:2, Matemática:3"><span class="help">Separe as disciplinas por vírgula.</span></label><label class="full">Gabarito<input name="answerKey" class="question-input" required placeholder="A,C,B,D"><span class="help">Separe as respostas por vírgula. A quantidade deve coincidir com o total de questões.</span></label></form>`, footer: `<button class="btn" data-close-modal>Cancelar</button><button class="btn btn-primary" data-action="save-assessment">Criar simulado</button>` });
  }

  function saveAssessment() {
    const form = $("#assessment-form"); if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const disciplines = data.disciplines.split(",").map(item => { const [name, q] = item.split(":"); return { name: name.trim(), questions: Number(q) || 0 }; }).filter(d => d.name && d.questions > 0);
    const answerKey = data.answerKey.split(/[,;\s]+/).map(x => x.trim().toUpperCase()).filter(Boolean);
    const total = disciplines.reduce((sum,d) => sum + d.questions, 0);
    if (!disciplines.length || total !== answerKey.length) return toast(`O total de questões (${total}) precisa ser igual ao gabarito (${answerKey.length}).`);
    state.assessments.push({ id: uid("ass"), title: data.title.trim(), date: data.date, classId: data.classId, disciplines, answerKey });
    saveState("Simulado criado."); closeModal(); renderAssessments();
  }

  function launchResultsModal(assessmentId) {
    const assessment = assessmentById(assessmentId);
    const students = activeStudents(assessment.classId).sort((a,b)=>a.name.localeCompare(b.name));
    openModal({ title: `Resultados · ${esc(assessment.title)}`, wide: true, body: `<div class="insight" style="margin-bottom:14px"><span>i</span><div><strong>Gabarito: ${assessment.answerKey.join(" · ")}</strong><p>Digite as respostas separadas por vírgula ou marque falta.</p></div></div><div class="table-wrap"><table id="results-table"><thead><tr><th>Aluno</th><th>Respostas</th><th>Faltou</th><th>Prévia</th></tr></thead><tbody>${students.map(s => { const r=state.results.find(x=>x.assessmentId===assessmentId&&x.studentId===s.id); return `<tr data-student="${s.id}"><td><strong>${esc(s.name)}</strong><br><small class="text-muted">RA ${esc(s.ra||"—")}</small></td><td><input class="result-answers question-input" value="${esc((r?.answers||[]).join(","))}" placeholder="A,B,C..."></td><td><input class="result-absent" type="checkbox" ${r?.absent ? "checked" : ""}></td><td class="result-preview">${r?.absent ? "Falta" : r ? percent(resultScore(r,assessment)) : "—"}</td></tr>`; }).join("")}</tbody></table></div>`, footer: `<button class="btn" data-close-modal>Cancelar</button><button class="btn btn-primary" data-action="save-results" data-id="${assessmentId}">Salvar resultados</button>`, onOpen: () => updateResultPreviews(assessmentId) });
  }

  function updateResultPreviews(assessmentId) {
    const assessment = assessmentById(assessmentId);
    $$("#results-table tbody tr").forEach(row => {
      const answers = row.querySelector(".result-answers").value.split(/[,;\s]+/).map(x=>x.toUpperCase()).filter(Boolean);
      const absent = row.querySelector(".result-absent").checked;
      const temp = { answers, absent };
      row.querySelector(".result-preview").textContent = absent ? "Falta" : answers.length ? percent(resultScore(temp,assessment)) : "—";
    });
  }

  function saveResults(assessmentId) {
    const assessment = assessmentById(assessmentId);
    $$("#results-table tbody tr").forEach(row => {
      const studentId = row.dataset.student;
      const answers = row.querySelector(".result-answers").value.split(/[,;\s]+/).map(x=>x.trim().toUpperCase()).filter(Boolean);
      const absent = row.querySelector(".result-absent").checked;
      let result = state.results.find(r => r.assessmentId === assessmentId && r.studentId === studentId);
      if (!result) { result = { id: uid("res"), assessmentId, studentId, answers: [], absent: false }; state.results.push(result); }
      result.answers = answers.slice(0, assessment.answerKey.length); result.absent = absent;
    });
    saveState("Resultados salvos."); closeModal(); renderAssessments();
  }

  function assessmentDetailsModal(id) {
    const a = assessmentById(id); const stats = assessmentStats(a);
    const rows = activeStudents(a.classId).map(s => { const r=state.results.find(x=>x.assessmentId===id&&x.studentId===s.id); return { s, r, score: resultScore(r,a) }; }).sort((x,y)=>(y.score||-1)-(x.score||-1));
    const questionStats = a.answerKey.map((key,index) => { const valid=state.results.filter(r=>r.assessmentId===id&&!r.absent); const correct=valid.filter(r=>normalize(r.answers?.[index]).toUpperCase()===key.toUpperCase()).length; return { index:index+1, key, rate:valid.length?(correct/valid.length)*100:0 }; });
    openModal({ title: `Análise · ${esc(a.title)}`, wide: true, body: `<div class="grid grid-3">${statCard("Média",percent(stats.average),"Desempenho da turma","✓")}${statCard("Participação",percent(stats.participation),`${stats.launched} lançamentos`,"♙")}${statCard("Ausentes",stats.absent,"Marcados no simulado","!")}</div><div class="grid grid-2" style="margin-top:16px"><section class="card"><div class="card-header"><h3 class="section-title">Acerto por questão</h3></div><div class="card-body">${questionStats.map(q=>progressRow(`Questão ${q.index} (${q.key})`,q.rate)).join("")}</div></section><section class="card"><div class="card-header"><h3 class="section-title">Resultados individuais</h3></div><div class="table-wrap"><table><thead><tr><th>Aluno</th><th>Resultado</th><th>Meta seguinte</th></tr></thead><tbody>${rows.map(item=>`<tr><td>${esc(item.s.name)}</td><td>${item.r?.absent?`<span class="badge danger">Faltou</span>`:item.r?`<strong>${percent(item.score)}</strong>`:"—"}</td><td>${item.r&&!item.r.absent?`${Math.max(state.config.minimumGoal||50,Math.min(100,Math.ceil((item.score+10)/5)*5))}%`:"—"}</td></tr>`).join("")}</tbody></table></div></section></div>` });
  }

  function attendanceSummaryModal() {
    const byClass = state.classes.map(cls => { const students=activeStudents(cls.id); const freq=students.length?students.reduce((sum,s)=>sum+studentAttendance(s.id),0)/students.length:100; return {cls,freq}; });
    openModal({ title: "Resumo de frequência", body: `<div>${byClass.map(x=>progressRow(x.cls.name,x.freq)).join("")}</div><div class="insight-list" style="margin-top:18px">${activeStudents().filter(s=>studentAttendance(s.id)<80).map(s=>insight("!",s.name,`${classById(s.classId)?.name || "—"} · ${percent(studentAttendance(s.id))} de frequência`)).join("") || insight("✓","Sem frequência crítica","Nenhum aluno está abaixo de 80%.")}</div>` });
  }

  function saveSettings() {
    state.config.schoolName = $("#school-name").value.trim() || "Portal Escolar";
    state.config.subtitle = $("#school-subtitle").value.trim();
    state.config.theme = $("#setting-theme").value;
    state.config.entryTime = $("#entry-time").value;
    state.config.minimumGoal = clamp($("#minimum-goal").value, 0, 100);
    saveState("Configurações salvas."); renderSettings();
  }

  function exportBackup() { downloadText(`backup_portal_${todayISO()}.json`, JSON.stringify(state,null,2), "application/json"); }
  function importBackup() {
    const input = document.createElement("input"); input.type="file"; input.accept=".json";
    input.onchange = async () => { try { const parsed=JSON.parse(await input.files[0].text()); if(!parsed.config||!Array.isArray(parsed.classes)) throw new Error(); state=parsed; saveState("Backup importado."); renderPage(); } catch { toast("Arquivo de backup inválido."); } };
    input.click();
  }
  function resetData() { if(confirm("Restaurar os dados de demonstração? Os dados atuais serão apagados.")){ state=seedState(); saveState("Dados restaurados."); renderPage(); } }
  function downloadText(filename, content, type) { const blob=new Blob([content],{type}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }

  function login(username, password) {
    const user = state.users.find(u => normalize(u.username) === normalize(username) && u.password === password);
    if (!user) return toast("Usuário ou senha inválidos.");
    currentUser = user; sessionStorage.setItem(SESSION_KEY, user.id); showApp();
  }

  function showApp() {
    $("#login-view").classList.add("hidden"); $("#app-view").classList.remove("hidden");
    $("#user-name").textContent = currentUser.name; $("#user-role").textContent = roleLabel(currentUser.role); $("#user-avatar").textContent = initials(currentUser.name);
    $$('[data-admin-only]').forEach(el => el.classList.toggle("hidden", !isAdmin()));
    applyBrand(); updateStorageMeter(); navigate("dashboard");
  }

  function logout() { sessionStorage.removeItem(SESSION_KEY); currentUser=null; $("#app-view").classList.add("hidden"); $("#login-view").classList.remove("hidden"); }

  document.addEventListener("click", event => {
    const nav = event.target.closest("[data-page]"); if (nav) return navigate(nav.dataset.page);
    const pageLink = event.target.closest("[data-page-link]"); if (pageLink) return navigate(pageLink.dataset.pageLink);
    if (event.target.closest("[data-close-modal]")) return closeModal();
    const actionEl = event.target.closest("[data-action]"); if (!actionEl) return;
    const { action, id, class: classId, student, status, color } = actionEl.dataset;
    const actions = {
      "new-class": newClassModal,
      "save-class": saveClass,
      "view-class": () => viewClassModal(id),
      "new-student": () => newStudentModal(classId),
      "save-student": saveStudent,
      "import-students": () => importStudentsModal(classId),
      "process-student-import": processStudentImport,
      "download-template": downloadTemplate,
      "new-assessment": newAssessmentModal,
      "save-assessment": saveAssessment,
      "launch-results": () => launchResultsModal(id),
      "save-results": () => saveResults(id),
      "assessment-details": () => assessmentDetailsModal(id),
      "attendance-summary": attendanceSummaryModal,
      "save-attendance": saveAttendance,
      "open-attendance": () => navigate("frequencia"),
      "student-report": () => { reportStudentId=id; navigate("relatorios"); },
      "print-page": () => window.print(),
      "save-settings": saveSettings,
      "export-backup": exportBackup,
      "import-backup": importBackup,
      "reset-data": resetData,
      "set-accent": () => { setAccent(color); saveState(); renderSettings(); },
      "delete-assessment": () => { if(confirm("Excluir este simulado e seus resultados?")){ state.assessments=state.assessments.filter(a=>a.id!==id); state.results=state.results.filter(r=>r.assessmentId!==id); saveState("Simulado excluído."); renderAssessments(); } },
      "deactivate-student": () => { const s=studentById(id); if(s&&confirm(`Remover ${s.name} da lista ativa?`)){ s.active=false; saveState("Estudante removido."); closeModal(); renderClasses(); } },
      "set-status": () => { currentAttendanceDraft[student]=status; renderAttendanceRows(); }
    };
    actions[action]?.();
  });

  document.addEventListener("input", event => {
    if (event.target.matches("#attendance-search")) renderAttendanceRows();
    if (event.target.matches("#results-table input")) updateResultPreviews(event.target.closest(".modal").querySelector("[data-action='save-results']")?.dataset.id);
    if (event.target.matches("#assessment-search, #assessment-class-filter")) {
      const search=normalize($("#assessment-search").value), classId=$("#assessment-class-filter").value;
      $$("#assessment-grid .assessment-card").forEach(card => { const title=normalize(card.querySelector("h3")?.textContent), cls=normalize(card.querySelector(".text-muted")?.textContent); const className=normalize(classById(classId)?.name||""); card.style.display=(!search||title.includes(search))&&(!classId||cls.includes(className))?"grid":"none"; });
    }
  });

  document.addEventListener("change", event => {
    if (event.target.matches("#attendance-date, #attendance-class")) loadAttendanceDraft();
    if (event.target.matches("#attendance-bulk") && event.target.value) { Object.keys(currentAttendanceDraft).forEach(id => currentAttendanceDraft[id]=event.target.value); renderAttendanceRows(); event.target.value=""; }
    if (event.target.matches("#report-class")) { const classId=event.target.value; $("#report-student").innerHTML=studentOptions("",classId); reportStudentId=$("#report-student").value; $("#report-panel").innerHTML=renderReportSheet(reportStudentId); }
    if (event.target.matches("#report-student")) { reportStudentId=event.target.value; $("#report-panel").innerHTML=renderReportSheet(reportStudentId); }
    if (event.target.matches("#school-logo") && event.target.files[0]) { const reader=new FileReader(); reader.onload=()=>{ state.config.logo=reader.result; $("#logo-preview").innerHTML=`<img src="${reader.result}" alt="Logo">`; }; reader.readAsDataURL(event.target.files[0]); }
  });

  $("#login-form").addEventListener("submit", event => { event.preventDefault(); login($("#login-user").value, $("#login-password").value); });
  $$("[data-demo]").forEach(btn => btn.addEventListener("click", () => { const credentials={admin:["admin","admin123"],professor:["professor","prof123"],consulta:["consulta","consulta123"]}[btn.dataset.demo]; $("#login-user").value=credentials[0]; $("#login-password").value=credentials[1]; }));
  $("#logout-btn").addEventListener("click", logout);
  $("#theme-toggle").addEventListener("click", () => { state.config.theme=state.config.theme==="dark"?"light":"dark"; saveState(); renderPage(); });
  $("#menu-btn").addEventListener("click", () => $(".sidebar").classList.toggle("open"));
  $("#today-label").textContent = new Intl.DateTimeFormat("pt-BR", { weekday:"long", day:"2-digit", month:"long" }).format(new Date());
  $("#modal-root").addEventListener("click", event => { if(event.target === $("#modal-root")) closeModal(); });

  applyBrand();
  const sessionUser = state.users.find(u => u.id === sessionStorage.getItem(SESSION_KEY));
  if (sessionUser) { currentUser=sessionUser; showApp(); }
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(()=>{}));
})();
