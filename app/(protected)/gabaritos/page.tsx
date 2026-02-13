'use client';
import { useEffect, useState } from 'react';
import { parseAnswerSequence } from '@/lib/correction';

type Section = { id: string; exam: string; discipline: string; questionCount: number; answers: string[] };

export default function GabaritosPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const section = sections.find((s) => s.id === sectionId);

  useEffect(() => { fetch('/api/answer-keys').then((r) => r.json()).then((d) => { setSections(d.sections); if (d.sections[0]) { setSectionId(d.sections[0].id); setAnswers(d.sections[0].answers); } }); }, []);
  useEffect(() => { if (section) setAnswers(section.answers.length ? section.answers : Array.from({ length: section.questionCount }, () => '')); }, [sectionId]);

  return <div className="card p-4 space-y-3"><h2 className="font-semibold">Inserção do gabarito</h2><select className="input" value={sectionId} onChange={(e)=>setSectionId(e.target.value)}>{sections.map((s)=><option key={s.id} value={s.id}>{s.exam} - {s.discipline}</option>)}</select>{section && <><textarea className="input" placeholder="Cole: D B A ..." onBlur={(e)=>setAnswers(parseAnswerSequence(e.target.value, section.questionCount) as string[])} /><div className="grid grid-cols-5 md:grid-cols-10 gap-2">{answers.map((a,i)=><select key={i} className="input" value={a} onChange={(e)=>setAnswers((old)=>old.map((v,idx)=>idx===i?e.target.value:v))}><option value="">-</option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option></select>)}</div><button className="btn-primary" onClick={async()=>{await fetch('/api/answer-keys',{method:'POST',body:JSON.stringify({examSectionId:section.id,answers})});alert('Salvo');}}>Salvar gabarito</button><p className="text-sm text-slate-600">Faltam {answers.filter((a)=>!a).length} questões.</p></>}</div>;
}
