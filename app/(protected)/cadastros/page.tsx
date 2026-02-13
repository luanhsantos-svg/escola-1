import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export default async function CadastrosPage() {
  const user = await requireRole(['ADMIN']);
  const [classrooms, disciplines, teachers] = await Promise.all([
    prisma.classroom.findMany({ where: { schoolId: user.schoolId } }),
    prisma.discipline.findMany(),
    prisma.user.findMany({ where: { schoolId: user.schoolId, role: 'TEACHER' } })
  ]);
  return <div className="card p-4"><h2 className="font-semibold">Cadastros (Admin)</h2><p className="text-sm">Turmas: {classrooms.length} | Disciplinas: {disciplines.length} | Professores: {teachers.length}</p></div>;
}
