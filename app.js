const STORAGE_KEY = "escola_plus_data_v1";

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

  dashboardStats: document.getElementById("dashboardStats"),
  rankingTable: document.getElementById("rankingTable"),
  comparisonTable: document.getElementById("comparisonTable"),

  reportStudentSelector: document.getElementById("reportStudentSelector"),
  reportCards: document.getElementById("reportCards"),
  reportTemplate: document.getElementById("reportTemplate"),
  printCurrentReportBtn: document.getElementById("printCurrentReportBtn"),
  printAllReportsBtn: document.getElementById("printAllReportsBtn"),

  saveBackupBtn: document.getElementById("saveBackupBtn"),
  importFile: document.getElementById("importFile")
};

let state = loadState();
let subjectChart;
let taskChart;

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadState() {
  const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  return parsed || { classes: [], selectedClassId: null };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getSelectedClass() {
  return state.classes.find((c) => c.id === state.selectedClassId) || null;
}

function ensureSelectedClass() {
  if (!state.selectedClassId && state.classes.length) {
    state.selectedClassId = state.classes[0].id;
  }
}

function safeAvg(list) {
  if (!list.length) return 0;
  return list.reduce((a, b) => a + b, 0) / list.length;
}

function getStudentMetrics(classObj, studentId) {
  const activities = classObj.activities || [];
  const gradeActivities = activities.filter((a) => a.type === "avaliacao");
  const taskActivities = activities.filter((a) => a.type === "tarefa");

  const grades = gradeActivities
    .map((a) => Number(a.entries?.[studentId]))
    .filter((v) => !Number.isNaN(v));

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
      persist();
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
  el.reportStudentSelector.innerHTML = "<option value=''>Todos os alunos</option>";
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
      classObj.activities.forEach((a) => delete a.entries[student.id]);
      persist();
      renderAll();
    };
    tdAction.appendChild(btn);
    tr.appendChild(tdAction);
    el.studentTable.appendChild(tr);

    const op = document.createElement("option");
    op.value = student.id;
    op.textContent = student.name;
    el.reportStudentSelector.appendChild(op);
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
    ? "Para <strong>Tarefa / Pauta</strong>, selecione por aluno: <strong>R</strong> (realizou), <strong>NR</strong> (não realizou) ou <strong>F</strong> (faltou)."
    : "Para <strong>Trabalho / Avaliação</strong>, informe a nota por aluno de <strong>0 a 10</strong>.";

  const table = document.createElement("table");
  table.innerHTML = `<thead><tr><th>Aluno</th><th>Lançamento</th></tr></thead>`;
  const tbody = document.createElement("tbody");

  classObj.students.forEach((student) => {
    const tr = document.createElement("tr");
    const current = activity.entries?.[student.id] ?? "";
    let inputHtml = "";
    if (isTask) {
      inputHtml = `
        <select data-student-id="${student.id}" class="batch-input">
          <option value="">-</option>
          <option value="R" ${current === "R" ? "selected" : ""}>R</option>
          <option value="NR" ${current === "NR" ? "selected" : ""}>NR</option>
          <option value="F" ${current === "F" ? "selected" : ""}>F</option>
        </select>
      `;
    } else {
      inputHtml = `<input data-student-id="${student.id}" class="batch-input" type="number" min="0" max="10" step="0.1" value="${current}">`;
    }
    tr.innerHTML = `<td>${student.name}</td><td>${inputHtml}</td>`;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  el.batchGrid.innerHTML = "";
  el.batchGrid.appendChild(table);
}

function computeDashboard(classObj) {
  const comparisons = classObj.students.map((s) => {
    const metric = getStudentMetrics(classObj, s.id);
    return { student: s, ...metric };
  });

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

  const subjectAverages = classObj.subjects.map((subject) => {
    const grades = [];
    classObj.activities
      .filter((a) => a.type === "avaliacao" && a.subject === subject)
      .forEach((activity) => {
        Object.values(activity.entries || {}).forEach((v) => {
          const n = Number(v);
          if (!Number.isNaN(n)) grades.push(n);
        });
      });
    return { subject, avg: safeAvg(grades) };
  });

  return { comparisons, sortedRanking, taskStats, subjectAverages };
}

function renderDashboard() {
  const classObj = getSelectedClass();
  if (!classObj) return;

  const data = computeDashboard(classObj);
  const classAvg = safeAvg(data.comparisons.map((c) => c.avg));

  el.dashboardStats.innerHTML = `
    <div class="stat">Alunos<strong>${classObj.students.length}</strong></div>
    <div class="stat">Atividades<strong>${classObj.activities.length}</strong></div>
    <div class="stat">Média da turma<strong>${classAvg.toFixed(2)}</strong></div>
    <div class="stat">Matérias<strong>${classObj.subjects.length}</strong></div>
  `;

  el.rankingTable.innerHTML = data.sortedRanking
    .map((item, idx) => `<tr><td>${idx + 1}º</td><td>${item.student.name}</td><td>${item.avg.toFixed(2)}</td></tr>`)
    .join("");

  el.comparisonTable.innerHTML = data.comparisons
    .map(
      (item) =>
        `<tr><td>${item.student.name}</td><td>${item.avg.toFixed(2)}</td><td>${item.statusCount.R}</td><td>${item.statusCount.NR}</td><td>${item.statusCount.F}</td></tr>`
    )
    .join("");

  const subjectCtx = document.getElementById("subjectChart");
  if (subjectChart) subjectChart.destroy();
  subjectChart = new Chart(subjectCtx, {
    type: "bar",
    data: {
      labels: data.subjectAverages.map((s) => s.subject),
      datasets: [{ label: "Média", data: data.subjectAverages.map((s) => s.avg), backgroundColor: "#2f6fed" }]
    },
    options: { scales: { y: { min: 0, max: 10 } } }
  });

  const taskCtx = document.getElementById("taskChart");
  if (taskChart) taskChart.destroy();
  taskChart = new Chart(taskCtx, {
    type: "doughnut",
    data: {
      labels: ["R", "NR", "F"],
      datasets: [{ data: [data.taskStats.R, data.taskStats.NR, data.taskStats.F], backgroundColor: ["#23a36a", "#f39c2d", "#d9534f"] }]
    }
  });
}

function renderReports() {
  const classObj = getSelectedClass();
  if (!classObj) return;
  const selectedId = el.reportStudentSelector.value;
  const students = selectedId ? classObj.students.filter((s) => s.id === selectedId) : classObj.students;

  el.reportCards.innerHTML = "";
  students.forEach((student) => {
    const node = el.reportTemplate.content.cloneNode(true);
    const metric = getStudentMetrics(classObj, student.id);

    node.querySelector(".report-meta").textContent = `${student.name} · Turma ${classObj.name}`;
    node.querySelector(".report-date").textContent = new Date().toLocaleDateString("pt-BR");

    const tbody = node.querySelector(".report-grades");
    classObj.subjects.forEach((subject) => {
      const subjectGrades = classObj.activities
        .filter((a) => a.subject === subject && a.type === "avaliacao")
        .map((a) => Number(a.entries?.[student.id]))
        .filter((n) => !Number.isNaN(n));
      const avg = safeAvg(subjectGrades);
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${subject}</td><td>${avg.toFixed(2)}</td>`;
      tbody.appendChild(tr);
    });

    node.querySelector(".report-stats").innerHTML = `
      <div class="stat">Média Geral<strong>${metric.avg.toFixed(2)}</strong></div>
      <div class="stat">Tarefas R<strong>${metric.statusCount.R}</strong></div>
      <div class="stat">Tarefas NR<strong>${metric.statusCount.NR}</strong></div>
      <div class="stat">Faltas<strong>${metric.statusCount.F}</strong></div>
    `;

    el.reportCards.appendChild(node);
  });
}

function renderAll() {
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
  state.classes.push({ id: uid(), name, subjects: [], students: [], activities: [] });
  state.selectedClassId = state.classes.at(-1).id;
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
    entries: {}
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
  const activityId = el.activitySelector.value;
  classObj.activities = classObj.activities.filter((a) => a.id !== activityId);
  renderAll();
};

el.saveBatchBtn.onclick = () => {
  const classObj = getSelectedClass();
  if (!classObj) return;
  const activity = classObj.activities.find((a) => a.id === el.activitySelector.value);
  if (!activity) return;

  const inputs = el.batchGrid.querySelectorAll(".batch-input");
  inputs.forEach((input) => {
    const studentId = input.dataset.studentId;
    const raw = input.value;
    if (!raw) {
      delete activity.entries[studentId];
      return;
    }

    if (activity.type === "avaliacao") {
      const note = Number(raw);
      if (!Number.isNaN(note) && note >= 0 && note <= 10) {
        activity.entries[studentId] = note;
      }
    } else {
      if (["R", "NR", "F"].includes(raw)) activity.entries[studentId] = raw;
    }
  });

  renderAll();
};

el.clearBatchBtn.onclick = () => {
  const classObj = getSelectedClass();
  if (!classObj) return;
  const activity = classObj.activities.find((a) => a.id === el.activitySelector.value);
  if (!activity) return;
  activity.entries = {};
  renderAll();
};

el.reportStudentSelector.onchange = renderReports;
el.printCurrentReportBtn.onclick = () => window.print();
el.printAllReportsBtn.onclick = () => {
  el.reportStudentSelector.value = "";
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
  if (parsed && Array.isArray(parsed.classes)) {
    state = parsed;
    renderAll();
  }
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
