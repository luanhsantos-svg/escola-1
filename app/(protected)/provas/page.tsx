import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export default async function ProvasPage() {
  const user = await requireRole(['ADMIN', 'TEACHER', 'VIEWER']);
  const exams = await prisma.exam.findMany({ where: { schoolId: user.schoolId }, include: { sections: { include: { discipline: true } }, classrooms: { include: { classroom: true } } }, orderBy: { appliedAt: 'desc' } });
  const disciplines = await prisma.discipline.findMany({ orderBy: { name: 'asc' } });
  const classrooms = await prisma.classroom.findMany({ where: { schoolId: user.schoolId }, orderBy: { name: 'asc' } });
  const teachers = await prisma.user.findMany({ where: { schoolId: user.schoolId, role: { in: ['ADMIN', 'TEACHER'] } }, orderBy: { name: 'asc' } });

  return (
    <div className="space-y-4">
      <form action="/api/exams" method="post" className="card p-4 grid md:grid-cols-2 gap-3">
        <h2 className="font-semibold md:col-span-2">Criar prova (wizard rápido)</h2>
        <input name="title" className="input" placeholder="Provão 1º Bimestre" required />
        <input name="appliedAt" className="input" type="date" required />
        <input name="schoolYear" className="input" type="number" required defaultValue={new Date().getFullYear()} />
        <select name="status" className="input"><option>DRAFT</option><option>OPEN</option><option>CLOSED</option></select>
        <label className="text-sm">Turmas (CTRL/CMD para múltiplas)<select multiple name="classrooms" className="input h-24">{classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="text-sm">Seções: disciplinaId|questões|teacherId (uma por linha)
          <textarea name="sections" className="input h-24" defaultValue={disciplines.slice(0,2).map((d) => `${d.id}|10|${teachers[0]?.id || ''}`).join('\n')} />
        </label>
        <button className="btn-primary md:col-span-2">Salvar prova</button>
      </form>
      <div className="card p-4 overflow-x-auto">
        <table className="w-full text-sm"><thead><tr><th>Título</th><th>Status</th><th>Seções</th><th>Turmas</th></tr></thead><tbody>{exams.map((e)=><tr key={e.id} className="border-t"><td>{e.title}</td><td>{e.status}</td><td>{e.sections.map((s)=>`${s.discipline.name}(${s.questionCount})`).join(', ')}</td><td>{e.classrooms.map((c)=>c.classroom.name).join(', ')}</td></tr>)}</tbody></table>
      </div>
    </div>
  );
}
