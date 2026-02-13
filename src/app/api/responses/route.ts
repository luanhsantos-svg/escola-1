import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role === "VIEWER") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const data = await request.json();

  const response = await prisma.studentResponse.upsert({
    where: { examSectionId_studentId: { examSectionId: data.examSectionId, studentId: data.studentId } },
    update: { answers: data.answers, updatedByUserId: user.id },
    create: { examSectionId: data.examSectionId, studentId: data.studentId, answers: data.answers, updatedByUserId: user.id }
  });

  await prisma.attendance.upsert({
    where: { examId_studentId: { examId: data.examId, studentId: data.studentId } },
    update: { status: data.attendanceStatus },
    create: { examId: data.examId, studentId: data.studentId, status: data.attendanceStatus }
  });

  await prisma.auditLog.create({ data: { userId: user.id, action: "UPSERT", entity: "StudentResponse", entityId: response.id, payload: data } });
  return NextResponse.json({ ok: true });
}
