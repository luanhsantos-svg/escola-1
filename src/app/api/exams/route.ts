import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const exams = await prisma.exam.findMany({
    where: { schoolId: user.schoolId },
    include: { sections: { include: { discipline: true, teacherOwner: true } }, classrooms: { include: { classroom: true } } },
    orderBy: { appliedAt: "desc" }
  });
  return NextResponse.json(exams);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const data = await request.json();

  const exam = await prisma.exam.create({
    data: {
      schoolId: user.schoolId,
      title: data.title,
      appliedAt: new Date(data.appliedAt),
      schoolYear: Number(data.schoolYear),
      status: data.status,
      classrooms: { create: data.classroomIds.map((classroomId: string) => ({ classroomId })) },
      sections: {
        create: data.sections.map((s: { disciplineId: string; questionCount: number; teacherOwnerId: string }) => ({
          disciplineId: s.disciplineId,
          questionCount: Number(s.questionCount),
          teacherOwnerId: s.teacherOwnerId,
          allowedOptions: ["A", "B", "C", "D", "E"]
        }))
      }
    }
  });

  await prisma.auditLog.create({ data: { userId: user.id, action: "CREATE", entity: "Exam", entityId: exam.id, payload: data } });
  return NextResponse.json(exam);
}
