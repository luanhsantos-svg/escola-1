import { prisma } from "@/lib/prisma";

export default async function CadastrosPage() {
  const [disciplines, classrooms, users] = await Promise.all([
    prisma.discipline.findMany({ orderBy: { name: "asc" } }),
    prisma.classroom.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Cadastros</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded bg-white p-4 shadow"><h3 className="mb-2 font-medium">Disciplinas</h3><ul className="text-sm">{disciplines.map((d) => <li key={d.id}>{d.name}</li>)}</ul></section>
        <section className="rounded bg-white p-4 shadow"><h3 className="mb-2 font-medium">Turmas</h3><ul className="text-sm">{classrooms.map((c) => <li key={c.id}>{c.name} ({c.year})</li>)}</ul></section>
        <section className="rounded bg-white p-4 shadow"><h3 className="mb-2 font-medium">Usuários</h3><ul className="text-sm">{users.map((u) => <li key={u.id}>{u.name} - {u.role}</li>)}</ul></section>
      </div>
    </div>
  );
}
