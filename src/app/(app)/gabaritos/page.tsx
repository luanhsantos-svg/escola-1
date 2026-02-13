"use client";

import { useEffect, useState } from "react";
import { normalizeAnswers } from "@/lib/correction";

type Exam = { id: string; title: string; sections: { id: string; questionCount: number; discipline: { name: string } }[] };

export default function GabaritosPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [bulk, setBulk] = useState("");

  useEffect(() => {
    fetch("/api/exams").then((r) => r.json()).then(setExams);
  }, []);

  const section = exams.flatMap((e) => e.sections).find((s) => s.id === sectionId);

  useEffect(() => {
    if (section) {
      setQuestionCount(section.questionCount);
      setAnswers(Array.from({ length: section.questionCount }).map(() => ""));
    }
  }, [sectionId]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Inserção do Gabarito</h2>
      <select className="rounded border p-2" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
        <option value="">Selecione prova/disciplina</option>
        {exams.map((exam) => exam.sections.map((s) => <option value={s.id} key={s.id}>{exam.title} - {s.discipline.name}</option>))}
      </select>
      {!section ? <p className="text-sm text-slate-500">Selecione a prova para começar.</p> : null}
      {section ? (
        <div className="space-y-3 rounded bg-white p-4 shadow">
          <textarea className="w-full rounded border p-2" placeholder="Cole sequência: D B A A B ..." value={bulk} onChange={(e) => setBulk(e.target.value)} />
          <button className="rounded bg-slate-700 px-3 py-2 text-sm text-white" onClick={() => setAnswers(normalizeAnswers(bulk, questionCount) as string[])}>Distribuir sequência</button>
          <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
            {answers.map((ans, i) => (
              <input key={i} className="rounded border p-2 text-center" value={ans} maxLength={1} onChange={(e) => {
                const next = [...answers];
                next[i] = e.target.value.toUpperCase();
                setAnswers(next);
              }} placeholder={`Q${i + 1}`} />
            ))}
          </div>
          <button className="rounded bg-brand-600 px-4 py-2 text-white" onClick={async () => {
            await fetch("/api/answer-keys", { method: "POST", body: JSON.stringify({ examSectionId: section.id, answers }) });
            alert("Gabarito salvo");
          }}>Salvar gabarito</button>
          <p className="text-sm text-slate-500">Faltam {answers.filter((a) => !a).length} questões.</p>
        </div>
      ) : null}
    </div>
  );
}
