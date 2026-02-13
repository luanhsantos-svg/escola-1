'use client';
import { useEffect, useState } from 'react';

type Data = { sections: { id: string; label: string; questionCount: number }[]; classrooms: { id: string; name: string }[]; students: { id: string; fullName: string; attendance: string; answers: string[]; totalCorrect: number }[] };

export default function LancamentosPage() {
  const [data, setData] = useState<Data>({ sections: [], classrooms: [], students: [] });
  const [sectionId, setSectionId] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [saved, setSaved] = useState('');

  async function load() {
    const q = new URLSearchParams({ sectionId, classroomId });
    const res = await fetch(`/api/responses?${q.toString()}`);
    const json = await res.json();
    setData(json);
    if (!sectionId && json.sections[0]) setSectionId(json.sections[0].id);
    if (!classroomId && json.classrooms[0]) setClassroomId(json.classrooms[0].id);
  }
  useEffect(() => { load(); }, [sectionId, classroomId]);

  async function saveRow(studentId: string, answers: string[], attendance: string) {
    await fetch('/api/responses', { method: 'POST', body: JSON.stringify({ sectionId, classroomId, studentId, answers, attendance }) });
    setSaved(`Salvo ${new Date().toLocaleTimeString('pt-BR')}`);
  }

  const section = data.sections.find((s) => s.id === sectionId);
  return <div className="card p-4 overflow-auto"><h2 className="font-semibold">Lançamento por turma</h2><div className="grid md:grid-cols-2 gap-2 my-3"><select className="input" value={classroomId} onChange={(e)=>setClassroomId(e.target.value)}>{data.classrooms.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select><select className="input" value={sectionId} onChange={(e)=>setSectionId(e.target.value)}>{data.sections.map((s)=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div><p className="text-xs text-emerald-700">{saved}</p><table className="text-xs"><thead><tr><th>Aluno</th><th>Presença</th>{Array.from({length:section?.questionCount || 0}).map((_,i)=><th key={i}>Q{i+1}</th>)}<th>Acertos</th><th /></tr></thead><tbody>{data.students.map((st)=><Row key={st.id} st={st} count={section?.questionCount || 0} onSave={saveRow} />)}</tbody></table></div>;
}

function Row({ st, count, onSave }: any) {
  const [answers, setAnswers] = useState<string[]>(st.answers?.length ? st.answers : Array.from({ length: count }, () => ''));
  const [attendance, setAttendance] = useState(st.attendance || 'PRESENTE');
  return <tr className="border-t"><td className="pr-2">{st.fullName}</td><td><select value={attendance} className="input" onChange={(e)=>setAttendance(e.target.value)}><option>PRESENTE</option><option>FALTOU</option></select></td>{answers.map((a,i)=><td key={i}><select className="input w-14" value={a} onChange={(e)=>setAnswers((old)=>old.map((v,idx)=>idx===i?e.target.value:v))}><option value="">-</option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option></select></td>)}<td>{st.totalCorrect}</td><td><button className="btn-secondary" onClick={()=>onSave(st.id, answers, attendance)}>Salvar</button></td></tr>;
}
