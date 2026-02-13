"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeAnswers } from "@/lib/correction";

const options = ["", "A", "B", "C", "D", "E"];

export default function LancamentosPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [examSectionId, setExamSectionId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [cache, setCache] = useState<Record<string, string[]>>({});
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/exams").then((r) => r.json()).then((data) => {
      setExams(data);
      const uniqueClasses = Array.from(new Set(data.flatMap((e: any) => (e.classrooms || []).map((c: any) => JSON.stringify(c.classroom))))).map((item) => JSON.parse(item as string));
      setClassrooms(uniqueClasses);
    });
  }, []);

  useEffect(() => {
    if (!classroomId) return;
    fetch(`/api/launch-data?classroomId=${classroomId}`).then((r) => r.json()).then((d) => setStudents(d.students));
  }, [classroomId]);

  const section = exams.flatMap((e) => e.sections).find((s) => s.id === examSectionId);
  const filtered = useMemo(() => students.filter((s) => s.fullName.toLowerCase().includes(query.toLowerCase())), [students, query]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Lançamento de respostas</h2>
      <div className="grid gap-2 md:grid-cols-3">
        <select className="rounded border p-2" value={classroomId} onChange={(e) => setClassroomId(e.target.value)}><option value="">Turma</option>{classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select className="rounded border p-2" value={examSectionId} onChange={(e) => setExamSectionId(e.target.value)}><option value="">Disciplina da prova</option>{exams.map((exam) => exam.sections.map((s: any) => <option key={s.id} value={s.id}>{exam.title} - {s.discipline.name}</option>))}</select>
        <input className="rounded border p-2" placeholder="Buscar aluno" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="overflow-auto rounded bg-white p-3 shadow">
        <table className="min-w-full text-xs">
          <thead><tr><th className="p-1 text-left">Aluno</th>{Array.from({ length: section?.questionCount ?? 0 }).map((_, i) => <th key={i}>Q{i + 1}</th>)}<th>Presença</th><th>Ação</th></tr></thead>
          <tbody>
            {filtered.map((student) => {
              const arr = cache[student.id] || Array.from({ length: section?.questionCount ?? 0 }).map(() => "");
              return <tr key={student.id} className="border-t"><td className="p-1">{student.fullName}</td>{arr.map((a, idx) => <td key={idx}><select className="table-cell-answer" value={a} onChange={(e) => {
                const next = [...arr]; next[idx] = e.target.value;
                setCache((prev) => ({ ...prev, [student.id]: next }));
              }}>{options.map((op) => <option key={op} value={op}>{op || "_"}</option>)}</select></td>)}
              <td><select className="rounded border p-1" defaultValue="PRESENTE"><option>PRESENTE</option><option>FALTOU</option></select></td>
              <td><button className="rounded bg-brand-600 px-2 py-1 text-white" onClick={async () => {
                const answers = normalizeAnswers(arr.join(" "), section?.questionCount || 0);
                await fetch("/api/responses", { method: "POST", body: JSON.stringify({ examSectionId, studentId: student.id, answers, examId: exams[0]?.id, attendanceStatus: "PRESENTE" }) });
              }}>Salvar</button></td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
