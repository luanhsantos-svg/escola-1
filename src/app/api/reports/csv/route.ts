import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { searchParams } = new URL(request.url);
  const classroomId = searchParams.get("classroomId");
  if (!classroomId) return new Response("classroomId obrigatório", { status: 400 });

  const students = await prisma.student.findMany({ where: { classroomId }, orderBy: { fullName: "asc" } });
  const csv = ["Aluno,Matrícula,Ativo", ...students.map((s) => `${s.fullName},${s.registrationNumber ?? ""},${s.active ? "Sim" : "Não"}`)].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=boletim-${classroomId}.csv`
    }
  });
}
