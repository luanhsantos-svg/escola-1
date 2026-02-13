import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export default async function ProvasPage() {
  const user = await getSessionUser();
  const exams = await prisma.exam.findMany({ where: { schoolId: user!.schoolId }, include: { sections: { include: { discipline: true } } }, orderBy: { appliedAt: "desc" } });
  const disciplines = await prisma.discipline.findMany({ orderBy: { name: "asc" } });
  const classrooms = await prisma.classroom.findMany({ where: { schoolId: user!.schoolId, active: true } });
  const teachers = await prisma.user.findMany({ where: { schoolId: user!.schoolId, role: "TEACHER", active: true } });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Provas</h2>
      <form className="grid gap-3 rounded bg-white p-4 shadow" action="/api/exams" method="post">
        <p className="font-medium">Nova prova (wizard rápido)</p>
        <input name="title" className="rounded border p-2" placeholder="Provão 1º Bimestre" required />
        <div className="grid gap-3 md:grid-cols-3">
          <input name="appliedAt" type="date" className="rounded border p-2" required />
          <input name="schoolYear" type="number" className="rounded border p-2" defaultValue={2026} required />
          <select name="status" className="rounded border p-2" defaultValue="DRAFT"><option>DRAFT</option><option>OPEN</option><option>CLOSED</option></select>
        </div>
        <p className="text-sm text-slate-600">Use a API /api/exams com JSON para cadastrar várias seções/turmas no wizard completo.</p>
      </form>

      <div className="rounded bg-white p-4 shadow">
        <h3 className="mb-3 font-medium">Provas cadastradas</h3>
        <ul className="space-y-2 text-sm">
          {exams.map((exam) => (
            <li key={exam.id} className="rounded border p-2">
              <strong>{exam.title}</strong> • {new Date(exam.appliedAt).toLocaleDateString("pt-BR")} • {exam.status}
              <div className="text-slate-600">Disciplinas: {exam.sections.map((s) => `${s.discipline.name} (${s.questionCount})`).join(", ")}</div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500">Catálogos: {disciplines.length} disciplinas, {classrooms.length} turmas, {teachers.length} professores.</p>
      </div>
    </div>
  );
}
