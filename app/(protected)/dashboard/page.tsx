import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { gradeSection } from '@/lib/correction';

export default async function DashboardPage({ searchParams }: { searchParams: Record<string, string> }) {
  const user = await requireRole(['ADMIN', 'TEACHER', 'VIEWER']);
  const exams = await prisma.exam.findMany({ where: { schoolId: user.schoolId }, orderBy: { appliedAt: 'desc' } });
  const examId = searchParams.examId || exams[0]?.id;
  if (!examId) return <div className="card p-4">Sem prova.</div>;
  const sections = await prisma.examSection.findMany({ where: { examId }, include: { discipline: true, responses: true, answerKey: true } });
  const attendances = await prisma.attendance.findMany({ where: { examId } });
  let attempts = 0; let sum = 0;
  for (const section of sections) {
    const key = (section.answerKey?.answers as string[] | undefined) || [];
    for (const r of section.responses) {
      if (!key.length) continue;
      attempts += 1; sum += gradeSection(key as any, r.answers as any).scorePercent;
    }
  }
  const absenceRate = attendances.length ? Math.round((attendances.filter((a)=>a.status==='FALTOU').length/attendances.length)*100) : 0;

  return <div className="space-y-4"><form className="card p-4"><select name="examId" defaultValue={examId} className="input">{exams.map((e)=><option value={e.id} key={e.id}>{e.title}</option>)}</select><button className="btn-secondary mt-2">Filtrar</button></form><div className="grid md:grid-cols-4 gap-3"><Kpi label="Média geral" value={`${attempts?Math.round(sum/attempts):0}%`} /><Kpi label="Taxa de ausência" value={`${absenceRate}%`} /><Kpi label="Seções" value={String(sections.length)} /><Kpi label="Respostas" value={String(sections.reduce((acc,s)=>acc+s.responses.length,0))} /></div><div className="card p-4"><h3 className="font-semibold">Questões mais erradas</h3><ul className="text-sm mt-2 space-y-1">{sections.map((s)=>{const key=(s.answerKey?.answers as string[]|undefined)||[];let wrong=0;let total=0;s.responses.forEach((r)=>{(r.answers as string[]).forEach((ans,i)=>{if(key[i]){total+=1;if(ans && ans!==key[i]) wrong+=1;}})});return <li key={s.id}>{s.discipline.name}: {total?Math.round((wrong/total)*100):0}% erro</li>})}</ul></div></div>;
}

function Kpi({ label, value }: { label: string; value: string }) { return <div className="card p-4"><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold">{value}</p></div>; }
