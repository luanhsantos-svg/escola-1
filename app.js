const STORAGE_KEY = "escola_plus_data_v2";

const el = {
  classForm: document.getElementById("classForm"),
  className: document.getElementById("className"),
  classSelector: document.getElementById("classSelector"),
  deleteClassBtn: document.getElementById("deleteClassBtn"),

  subjectForm: document.getElementById("subjectForm"),
  subjectName: document.getElementById("subjectName"),
  subjectList: document.getElementById("subjectList"),

  studentSingleForm: document.getElementById("studentSingleForm"),
  studentName: document.getElementById("studentName"),
  studentBatchForm: document.getElementById("studentBatchForm"),
  studentBatch: document.getElementById("studentBatch"),
  studentTable: document.getElementById("studentTable"),

  activityForm: document.getElementById("activityForm"),
  activitySubject: document.getElementById("activitySubject"),
  activityType: document.getElementById("activityType"),
  activityDate: document.getElementById("activityDate"),
  activityTitle: document.getElementById("activityTitle"),
  activityDescription: document.getElementById("activityDescription"),
  activitySelector: document.getElementById("activitySelector"),
  removeActivityBtn: document.getElementById("removeActivityBtn"),
  batchHint: document.getElementById("batchHint"),
  batchGrid: document.getElementById("batchGrid"),
  saveBatchBtn: document.getElementById("saveBatchBtn"),
  clearBatchBtn: document.getElementById("clearBatchBtn"),

  dashboardClassSelector: document.getElementById("dashboardClassSelector"),
  dashboardSubjectSelector: document.getElementById("dashboardSubjectSelector"),
  dashboardStats: document.getElementById("dashboardStats"),
  rankingTable: document.getElementById("rankingTable"),
  comparisonTable: document.getElementById("comparisonTable"),

  reportClassSelector: document.getElementById("reportClassSelector"),
  reportSubjectSelector: document.getElementById("reportSubjectSelector"),
  reportStudentSelector: document.getElementById("reportStudentSelector"),
  reportCards: document.getElementById("reportCards"),
  reportTemplate: document.getElementById("reportTemplate"),
  printCurrentReportBtn: document.getElementById("printCurrentReportBtn"),
  printAllReportsBtn: document.getElementById("printAllReportsBtn"),

  saveBackupBtn: document.getElementById("saveBackupBtn"),
  importFile: document.getElementById("importFile")
};

let state = loadState();
let comparisonChart;
let taskChart;

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultViewState(classes = []) {
  const firstId = classes[0]?.id || null;
  return {
    dashboardClassId: firstId,
    dashboardSubject: "all",
    reportClassId: firstId,
    reportSubject: "all",
    reportStudentId: ""
  };
}

function normalizeState(raw) {
  const normalized = raw || { classes: [], selectedClassId: null, view: defaultViewState() };
  normalized.classes ||= [];
  normalized.view ||= defaultViewState(normalized.classes);
  normalized.selectedClassId ||= normalized.classes[0]?.id || null;

  normalized.classes.forEach((c) => {
    c.subjects ||= [];
    c.students ||= [];
    c.activities ||= [];
    c.activities.forEach((a) => {
      a.entries ||= {};
      a.weights ||= {};
      a.description ||= "";
    });
  });
  return normalized;
}

function loadState() {
  const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  return normalizeState(parsed);
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensureSelectedClass() {
  if (!state.selectedClassId && state.classes.length) {
    state.selectedClassId = state.classes[0].id;
  }
}

function ensureViewSelections() {
  const classIds = state.classes.map((c) => c.id);
  if (!classIds.includes(state.view.dashboardClassId)) {
    state.view.dashboardClassId = classIds[0] || null;
  }
  if (!classIds.includes(state.view.reportClassId)) {
    state.view.reportClassId = classIds[0] || null;
  }
}

function safeAvg(list) {
  if (!list.length) return 0;
  return list.reduce((a, b) => a + b, 0) / list.length;
}

function getClassById(classId) {
  return state.classes.find((c) => c.id === classId) || null;
}

function getSelectedClass() {
  return getClassById(state.selectedClassId);
}

function getDashboardClass() {
  return getClassById(state.view.dashboardClassId);
}

function getReportClass() {
  return getClassById(state.view.reportClassId);
}

function getFilteredActivities(classObj, subject = "all") {
  if (!classObj) return [];
  return classObj.activities.filter((a) => subject === "all" || a.subject === subject);
}

function parseGrade(activity, studentId) {
  const note = Number(activity.entries?.[studentId]);
  return Number.isNaN(note) ? null : note;
}

function getStudentMetrics(classObj, studentId, subject = "all") {
  const activities = getFilteredActivities(classObj, subject);
  const gradeActivities = activities.filter((a) => a.type === "avaliacao");
  const taskActivities = activities.filter((a) => a.type === "tarefa");

  const grades = gradeActivities.map((a) => parseGrade(a, studentId)).filter((n) => n !== null);

  const statusCount = { R: 0, NR: 0, F: 0 };
  taskActivities.forEach((a) => {
    const status = a.entries?.[studentId];
    if (statusCount[status] !== undefined) statusCount[status] += 1;
  });

  return {
    avg: safeAvg(grades),
    gradesCount: grades.length,
    statusCount
  };
}

function weightedAverageForStudent(classObj, studentId, subject = "all") {
  const gradeActivities = getFilteredActivities(classObj, subject).filter((a) => a.type === "avaliacao");
  let weightedSum = 0;
  let totalWeight = 0;
  let doneCount = 0;

  gradeActivities.forEach((activity) => {
    const note = parseGrade(activity, studentId);
    if (note === null) return;
    const weight = Number(activity.weights?.[studentId] ?? 1);
    if (Number.isNaN(weight) || weight <= 0) return;
    weightedSum += note * weight;
    totalWeight += weight;
    doneCount += 1;
  });

  return {
    doneCount,
    totalWeight,
    weightedAvg: totalWeight ? weightedSum / totalWeight : 0
  };
}

function feedbackMessage(score) {
  if (score <= 4) {
    return {
      css: "feedback-low",
      text: "PRECISA MELHORAR, VOCÊ TEM POTENCIAL."
    };
  }
  if (score <= 7) {
    return {
      css: "feedback-mid",
      text: "VOCÊ CONSEGUE SER MELHOR QUE ISSO, CONFIA!"
    };
  }
  return {
    css: "feedback-high",
    text: "PARABÉNS, VOCÊ É FERA!!!!"
  };
}

function renderClassSelector() {
  ensureSelectedClass();
  el.classSelector.innerHTML = "";
  if (!state.classes.length) {
    el.classSelector.innerHTML = "<option>Cadastre uma turma</option>";
    return;
  }

  state.classes.forEach((c) => {
    const option = document.createElement("option");
    option.value = c.id;
    option.textContent = c.name;
    option.selected = c.id === state.selectedClassId;
    el.classSelector.appendChild(option);
  });
}

function renderSubjects() {
  const classObj = getSelectedClass();
  el.subjectList.innerHTML = "";
  el.activitySubject.innerHTML = "<option value=''>Matéria</option>";

  if (!classObj) return;
  classObj.subjects.forEach((subject) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${subject}</span>`;
    const btn = document.createElement("button");
    btn.textContent = "Excluir";
    btn.className = "danger-btn";
    btn.onclick = () => {
      classObj.subjects = classObj.subjects.filter((s) => s !== subject);
      classObj.activities = classObj.activities.filter((a) => a.subject !== subject);
      renderAll();
    };
    li.appendChild(btn);
    el.subjectList.appendChild(li);

    const op = document.createElement("option");
    op.value = subject;
    op.textContent = subject;
    el.activitySubject.appendChild(op);
  });
}

function renderStudents() {
  const classObj = getSelectedClass();
  el.studentTable.innerHTML = "";
  if (!classObj) return;

  classObj.students.forEach((student, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${idx + 1}</td><td>${student.name}</td>`;
    const tdAction = document.createElement("td");
    const btn = document.createElement("button");
    btn.textContent = "Excluir";
    btn.className = "danger-btn";
    btn.onclick = () => {
      classObj.students = classObj.students.filter((s) => s.id !== student.id);
      classObj.activities.forEach((a) => {
        delete a.entries[student.id];
        delete a.weights[student.id];
      });
      renderAll();
    };
    tdAction.appendChild(btn);
    tr.appendChild(tdAction);
    el.studentTable.appendChild(tr);
  });
}

function renderActivitySelector() {
  const classObj = getSelectedClass();
  el.activitySelector.innerHTML = "";

  if (!classObj || !classObj.activities.length) {
    el.activitySelector.innerHTML = "<option>Sem atividades</option>";
    el.batchGrid.innerHTML = "";
    return;
  }

  classObj.activities
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((activity) => {
      const op = document.createElement("option");
      op.value = activity.id;
      op.textContent = `${activity.date} · ${activity.subject} · ${activity.title} (${activity.type === "tarefa" ? "Tarefa" : "Avaliação"})`;
      el.activitySelector.appendChild(op);
    });

  renderBatchGrid();
}

function renderTaskButtons(current, studentId) {
  const statuses = [
    { code: "R", cls: "status-r" },
    { code: "NR", cls: "status-nr" },
    { code: "F", cls: "status-f" }
  ];
  const buttons = statuses
    .map(
      (s) =>
        `<button type="button" class="status-btn ${s.cls} ${current === s.code ? "active" : ""}" data-student-id="${studentId}" data-status="${s.code}">${s.code}</button>`
    )
    .join("");
  return `<div class="status-group">${buttons}<button type="button" class="status-btn clear-status" data-student-id="${studentId}" data-status="">Limpar</button></div>`;
}

function renderBatchGrid() {
  const classObj = getSelectedClass();
  if (!classObj || !classObj.activities.length) {
    el.batchGrid.innerHTML = "";
    return;
  }

  const activity = classObj.activities.find((a) => a.id === el.activitySelector.value) || classObj.activities[0];
  if (!activity) return;
  el.activitySelector.value = activity.id;

  const isTask = activity.type === "tarefa";
  el.batchHint.innerHTML = isTask
    ? "Para <strong>Tarefa / Pauta</strong>, use os botões coloridos: <strong>R</strong> (verde), <strong>NR</strong> (vermelho) e <strong>F</strong> (amarelo)."
    : "Para <strong>Trabalho / Avaliação</strong>, informe a nota por aluno de <strong>0 a 10</strong>.";

  const table = document.createElement("table");
  table.innerHTML = `<thead><tr><th>Aluno</th><th>Lançamento</th></tr></thead>`;
  const tbody = document.createElement("tbody");

  classObj.students.forEach((student) => {
    const tr = document.createElement("tr");
    const current = activity.entries?.[student.id] ?? "";
    const inputHtml = isTask
      ? renderTaskButtons(current, student.id)
      : `<input data-student-id="${student.id}" class="batch-input" type="number" min="0" max="10" step="0.1" value="${current}">`;

    tr.innerHTML = `<td>${student.name}</td><td>${inputHtml}</td>`;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  el.batchGrid.innerHTML = "";
  el.batchGrid.appendChild(table);

  if (isTask) {
    el.batchGrid.querySelectorAll(".status-btn[data-student-id]").forEach((btn) => {
      btn.onclick = () => {
        const { studentId, status } = btn.dataset;
        if (!status) {
          delete activity.entries[studentId];
        } else {
          activity.entries[studentId] = status;
        }
        renderBatchGrid();
      };
    });
  }
}

function renderDashboardFilters() {
  ensureViewSelections();

  el.dashboardClassSelector.innerHTML = "";
  state.classes.forEach((c) => {
    const op = document.createElement("option");
    op.value = c.id;
    op.textContent = c.name;
    op.selected = c.id === state.view.dashboardClassId;
    el.dashboardClassSelector.appendChild(op);
  });

  const classObj = getDashboardClass();
  el.dashboardSubjectSelector.innerHTML = "";
  const allOp = document.createElement("option");
  allOp.value = "all";
  allOp.textContent = "Todas as matérias";
  el.dashboardSubjectSelector.appendChild(allOp);

  if (classObj) {
    classObj.subjects.forEach((subject) => {
      const op = document.createElement("option");
      op.value = subject;
      op.textContent = subject;
      el.dashboardSubjectSelector.appendChild(op);
    });
  }
  el.dashboardSubjectSelector.value = classObj?.subjects.includes(state.view.dashboardSubject) ? state.view.dashboardSubject : "all";
}

function computeDashboard(classObj, subject) {
  const comparisons = classObj.students.map((s) => ({
    student: s,
    ...getStudentMetrics(classObj, s.id, subject)
  }));

  const sortedRanking = [...comparisons].sort((a, b) => b.avg - a.avg);
  const taskStats = comparisons.reduce(
    (acc, item) => {
      acc.R += item.statusCount.R;
      acc.NR += item.statusCount.NR;
      acc.F += item.statusCount.F;
      return acc;
    },
    { R: 0, NR: 0, F: 0 }
  );

  return { comparisons, sortedRanking, taskStats };
}

function renderDashboard() {
  renderDashboardFilters();
  const classObj = getDashboardClass();
  if (!classObj) {
    el.dashboardStats.innerHTML = "";
    el.rankingTable.innerHTML = "";
    el.comparisonTable.innerHTML = "";
    return;
  }

  const subject = el.dashboardSubjectSelector.value;
  state.view.dashboardSubject = subject;

  const filteredActivities = getFilteredActivities(classObj, subject);
  const data = computeDashboard(classObj, subject);
  const classAvg = safeAvg(data.comparisons.map((c) => c.avg));

  el.dashboardStats.innerHTML = `
    <div class="stat">Turma<strong>${classObj.name}</strong></div>
    <div class="stat">Matéria<strong>${subject === "all" ? "Todas" : subject}</strong></div>
    <div class="stat">Atividades<strong>${filteredActivities.length}</strong></div>
    <div class="stat">Média da turma<strong>${classAvg.toFixed(2)}</strong></div>
  `;

  el.rankingTable.innerHTML = data.sortedRanking
    .map((item, idx) => `<tr><td>${idx + 1}º</td><td>${item.student.name}</td><td>${item.avg.toFixed(2)}</td></tr>`)
    .join("");

  el.comparisonTable.innerHTML = data.comparisons
    .map(
      (item) =>
        `<tr><td>${item.student.name}</td><td>${item.avg.toFixed(2)}</td><td>${item.statusCount.R}</td><td>${item.statusCount.NR}</td><td>${item.statusCount.F}</td><td>${item.gradesCount}</td></tr>`
    )
    .join("");

  const comparisonCtx = document.getElementById("comparisonChart");
  if (comparisonChart) comparisonChart.destroy();
  comparisonChart = new Chart(comparisonCtx, {
    type: "bar",
    data: {
      labels: data.comparisons.map((c) => c.student.name),
      datasets: [{ label: "Média", data: data.comparisons.map((c) => c.avg), backgroundColor: "#2f6fed" }]
    },
    options: { scales: { y: { min: 0, max: 10 } } }
  });

  const taskCtx = document.getElementById("taskChart");
  if (taskChart) taskChart.destroy();
  taskChart = new Chart(taskCtx, {
    type: "doughnut",
    data: {
      labels: ["R", "NR", "F"],
      datasets: [{ data: [data.taskStats.R, data.taskStats.NR, data.taskStats.F], backgroundColor: ["#23a36a", "#e53935", "#f7c948"] }]
    }
  });
}

function renderReportFilters() {
  ensureViewSelections();
  el.reportClassSelector.innerHTML = "";
  state.classes.forEach((c) => {
    const op = document.createElement("option");
    op.value = c.id;
    op.textContent = c.name;
    op.selected = c.id === state.view.reportClassId;
    el.reportClassSelector.appendChild(op);
  });

  const classObj = getReportClass();

  el.reportSubjectSelector.innerHTML = "";
  el.reportSubjectSelector.appendChild(new Option("Todas as matérias", "all"));
  if (classObj) {
    classObj.subjects.forEach((subject) => el.reportSubjectSelector.appendChild(new Option(subject, subject)));
  }
  el.reportSubjectSelector.value = classObj?.subjects.includes(state.view.reportSubject) ? state.view.reportSubject : "all";

  el.reportStudentSelector.innerHTML = "";
  el.reportStudentSelector.appendChild(new Option("Todos os alunos", ""));
  if (classObj) {
    classObj.students.forEach((student) => el.reportStudentSelector.appendChild(new Option(student.name, student.id)));
  }
  const validStudent = classObj?.students.some((s) => s.id === state.view.reportStudentId);
  el.reportStudentSelector.value = validStudent ? state.view.reportStudentId : "";
}

function renderReports() {
  renderReportFilters();
  const classObj = getReportClass();
  if (!classObj) {
    el.reportCards.innerHTML = "";
    return;
  }

  const subject = el.reportSubjectSelector.value;
  const selectedId = el.reportStudentSelector.value;
  state.view.reportSubject = subject;
  state.view.reportStudentId = selectedId;

  const students = selectedId ? classObj.students.filter((s) => s.id === selectedId) : classObj.students;
  const reportActivities = getFilteredActivities(classObj, subject).filter((a) => a.type === "avaliacao");

  el.reportCards.innerHTML = "";
  students.forEach((student) => {
    const node = el.reportTemplate.content.cloneNode(true);
    node.querySelector(".report-meta").textContent = `${student.name} · Turma ${classObj.name} · ${subject === "all" ? "Todas as matérias" : subject}`;
    node.querySelector(".report-date").textContent = new Date().toLocaleDateString("pt-BR");

    const tbody = node.querySelector(".report-activities");
    reportActivities.forEach((activity) => {
      const note = parseGrade(activity, student.id);
      if (note === null) return;

      const tr = document.createElement("tr");
      const weight = Number(activity.weights?.[student.id] ?? 1);
      const weighted = note * weight;
      tr.innerHTML = `
        <td>${activity.subject} · ${activity.title}</td>
        <td>${activity.date}</td>
        <td><input type="number" min="0.1" step="0.1" class="weight-input" data-activity-id="${activity.id}" data-student-id="${student.id}" value="${weight}"></td>
        <td>${note.toFixed(2)}</td>
        <td>${weighted.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });

    const metrics = getStudentMetrics(classObj, student.id, subject);
    const weighted = weightedAverageForStudent(classObj, student.id, subject);
    const result = feedbackMessage(weighted.weightedAvg);

    node.querySelector(".report-stats").innerHTML = `
      <div class="stat">Qtd. Atividades<strong>${weighted.doneCount}</strong></div>
      <div class="stat">Peso Total<strong>${weighted.totalWeight.toFixed(1)}</strong></div>
      <div class="stat">Média Simples<strong>${metrics.avg.toFixed(2)}</strong></div>
      <div class="stat">Nota Final (peso)<strong>${weighted.weightedAvg.toFixed(2)}</strong></div>
      <div class="stat">Tarefas R<strong>${metrics.statusCount.R}</strong></div>
    `;

    const feedback = node.querySelector(".feedback-box");
    feedback.textContent = result.text;
    feedback.classList.add(result.css);
    el.reportCards.appendChild(node);
  });

  el.reportCards.querySelectorAll(".weight-input").forEach((input) => {
    input.onchange = () => {
      const classRef = getReportClass();
      const activity = classRef.activities.find((a) => a.id === input.dataset.activityId);
      if (!activity) return;
      const val = Number(input.value);
      if (!Number.isNaN(val) && val > 0) {
        activity.weights[input.dataset.studentId] = val;
      }
      persist();
      renderReports();
    };
  });
}

function renderAll() {
  ensureSelectedClass();
  ensureViewSelections();
  renderClassSelector();
  renderSubjects();
  renderStudents();
  renderActivitySelector();
  renderDashboard();
  renderReports();
  persist();
}

el.classForm.onsubmit = (e) => {
  e.preventDefault();
  const name = el.className.value.trim();
  if (!name) return;

  const newClass = { id: uid(), name, subjects: [], students: [], activities: [] };
  state.classes.push(newClass);
  state.selectedClassId = newClass.id;
  state.view.dashboardClassId = newClass.id;
  state.view.reportClassId = newClass.id;
  el.className.value = "";
  renderAll();
};

el.classSelector.onchange = () => {
  state.selectedClassId = el.classSelector.value;
  renderAll();
};

el.deleteClassBtn.onclick = () => {
  const classObj = getSelectedClass();
  if (!classObj) return;
  if (!confirm(`Excluir turma ${classObj.name}?`)) return;

  state.classes = state.classes.filter((c) => c.id !== classObj.id);
  state.selectedClassId = state.classes[0]?.id || null;
  ensureViewSelections();
  renderAll();
};

el.subjectForm.onsubmit = (e) => {
  e.preventDefault();
  const classObj = getSelectedClass();
  if (!classObj) return;

  const subject = el.subjectName.value.trim();
  if (!subject || classObj.subjects.includes(subject)) return;
  classObj.subjects.push(subject);
  el.subjectName.value = "";
  renderAll();
};

el.studentSingleForm.onsubmit = (e) => {
  e.preventDefault();
  const classObj = getSelectedClass();
  if (!classObj) return;

  const name = el.studentName.value.trim();
  if (!name) return;
  classObj.students.push({ id: uid(), name });
  el.studentName.value = "";
  renderAll();
};

el.studentBatchForm.onsubmit = (e) => {
  e.preventDefault();
  const classObj = getSelectedClass();
  if (!classObj) return;

  const names = el.studentBatch.value
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean);
  names.forEach((name) => classObj.students.push({ id: uid(), name }));
  el.studentBatch.value = "";
  renderAll();
};

el.activityForm.onsubmit = (e) => {
  e.preventDefault();
  const classObj = getSelectedClass();
  if (!classObj) return;

  const payload = {
    id: uid(),
    subject: el.activitySubject.value,
    type: el.activityType.value,
    date: el.activityDate.value,
    title: el.activityTitle.value.trim(),
    description: el.activityDescription.value.trim(),
    entries: {},
    weights: {}
  };

  if (!payload.subject || !payload.type || !payload.date || !payload.title) return;
  classObj.activities.push(payload);
  el.activityForm.reset();
  renderAll();
};

el.activitySelector.onchange = renderBatchGrid;

el.removeActivityBtn.onclick = () => {
  const classObj = getSelectedClass();
  if (!classObj || !classObj.activities.length) return;
  classObj.activities = classObj.activities.filter((a) => a.id !== el.activitySelector.value);
  renderAll();
};

el.saveBatchBtn.onclick = () => {
  const classObj = getSelectedClass();
  if (!classObj) return;
  const activity = classObj.activities.find((a) => a.id === el.activitySelector.value);
  if (!activity) return;

  if (activity.type === "avaliacao") {
    const inputs = el.batchGrid.querySelectorAll(".batch-input");
    inputs.forEach((input) => {
      const studentId = input.dataset.studentId;
      const raw = input.value;
      if (!raw) {
        delete activity.entries[studentId];
        return;
      }
      const note = Number(raw);
      if (!Number.isNaN(note) && note >= 0 && note <= 10) {
        activity.entries[studentId] = note;
      }
    });
  }

  renderAll();
};

el.clearBatchBtn.onclick = () => {
  const classObj = getSelectedClass();
  if (!classObj) return;
  const activity = classObj.activities.find((a) => a.id === el.activitySelector.value);
  if (!activity) return;
  activity.entries = {};
  activity.weights = {};
  renderAll();
};

el.dashboardClassSelector.onchange = () => {
  state.view.dashboardClassId = el.dashboardClassSelector.value;
  state.view.dashboardSubject = "all";
  renderDashboard();
  persist();
};

el.dashboardSubjectSelector.onchange = () => {
  state.view.dashboardSubject = el.dashboardSubjectSelector.value;
  renderDashboard();
  persist();
};

el.reportClassSelector.onchange = () => {
  state.view.reportClassId = el.reportClassSelector.value;
  state.view.reportSubject = "all";
  state.view.reportStudentId = "";
  renderReports();
  persist();
};

el.reportSubjectSelector.onchange = () => {
  state.view.reportSubject = el.reportSubjectSelector.value;
  renderReports();
  persist();
};

el.reportStudentSelector.onchange = () => {
  state.view.reportStudentId = el.reportStudentSelector.value;
  renderReports();
  persist();
};

el.printCurrentReportBtn.onclick = () => window.print();
el.printAllReportsBtn.onclick = () => {
  state.view.reportStudentId = "";
  renderReports();
  window.print();
};

el.saveBackupBtn.onclick = () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "escola-plus-backup.json";
  a.click();
};

el.importFile.onchange = async () => {
  const file = el.importFile.files[0];
  if (!file) return;
  const text = await file.text();
  const parsed = JSON.parse(text);
  state = normalizeState(parsed);
  renderAll();
  el.importFile.value = "";
};

Array.from(document.querySelectorAll(".tab")).forEach((tab) => {
  tab.onclick = () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("visible"));
    tab.classList.add("active");
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("visible");

    if (tab.dataset.tab === "dashboard") renderDashboard();
    if (tab.dataset.tab === "boletim") renderReports();
  };
});

renderAll();
