import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export default async function RelatoriosPage() {
  const user = await requireRole(['ADMIN', 'TEACHER', 'VIEWER']);
  const exams = await prisma.exam.findMany({ where: { schoolId: user.schoolId }, orderBy: { appliedAt: 'desc' } });
  return <div className="card p-4"><h2 className="font-semibold">Relatórios e exportações</h2><p className="text-sm text-slate-600">Exports CSV e impressão amigável.</p><ul className="list-disc pl-5 mt-2">{exams.map((e)=><li key={e.id}><a className="text-brand underline" href={`/api/reports?examId=${e.id}&type=classroom`}>CSV boletim de turma - {e.title}</a></li>)}</ul><button className="btn-secondary mt-4" onClick={() => window.print()}>Imprimir (print-friendly)</button></div>;
}
