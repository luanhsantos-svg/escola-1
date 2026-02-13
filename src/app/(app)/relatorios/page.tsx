import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export default async function RelatoriosPage() {
  const user = await getSessionUser();
  const classrooms = await prisma.classroom.findMany({ where: { schoolId: user!.schoolId, active: true }, orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Relatórios</h2>
      <p className="text-sm text-slate-600">Exportar CSV e usar impressão limpa (Ctrl+P) para gerar PDF.</p>
      <ul className="space-y-2">
        {classrooms.map((c) => <li key={c.id} className="rounded bg-white p-3 shadow"><Link className="text-brand-600 underline" href={`/api/reports/csv?classroomId=${c.id}`}>Exportar boletim CSV da turma {c.name}</Link></li>)}
      </ul>
    </div>
  );
}
