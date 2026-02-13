import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role === "VIEWER") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const data = await request.json();

  const section = await prisma.examSection.findUnique({ where: { id: data.examSectionId } });
  if (!section) return NextResponse.json({ error: "section_not_found" }, { status: 404 });

  const answers = data.answers as string[];
  if (answers.length !== section.questionCount) return NextResponse.json({ error: "invalid_size" }, { status: 400 });

  await prisma.answerKey.upsert({
    where: { examSectionId: section.id },
    update: { answers, updatedByUserId: user.id },
    create: { examSectionId: section.id, answers, updatedByUserId: user.id }
  });

  await prisma.auditLog.create({ data: { userId: user.id, action: "UPSERT", entity: "AnswerKey", entityId: section.id, payload: answers } });
  return NextResponse.json({ ok: true });
}
