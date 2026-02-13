"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [examId, setExamId] = useState("");
  const [data, setData] = useState<any>(null);

  useEffect(() => { fetch("/api/exams").then((r) => r.json()).then(setExams); }, []);
  useEffect(() => { if (examId) fetch(`/api/dashboard?examId=${examId}`).then((r) => r.json()).then(setData); }, [examId]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Tabulação geral</h2>
      <select className="rounded border p-2" value={examId} onChange={(e) => setExamId(e.target.value)}>
        <option value="">Selecione prova</option>
        {exams.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
      </select>

      {!data ? <p className="text-sm text-slate-500">Selecione a prova para começar.</p> : (
        <div className="grid gap-4 md:grid-cols-3">
          {data.perDiscipline.map((row: any) => (
            <div key={row.discipline} className="rounded bg-white p-4 shadow">
              <p className="text-sm text-slate-500">{row.discipline}</p>
              <p className="text-2xl font-semibold">{row.avgPercent}%</p>
              <p className="text-xs">Respostas lançadas: {row.responses}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
