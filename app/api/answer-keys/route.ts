import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

export async function GET() {
  const user = await requireUser();
  const sections = await prisma.examSection.findMany({
    where: user.role === 'ADMIN' ? { exam: { schoolId: user.schoolId } } : { teacherOwnerId: user.id },
    include: { exam: true, discipline: true, answerKey: true }
  });
  return NextResponse.json({ sections: sections.map((s) => ({ id: s.id, exam: s.exam.title, discipline: s.discipline.name, questionCount: s.questionCount, answers: (s.answerKey?.answers as string[] | null) || Array.from({ length: s.questionCount }, () => '') })) });
}

export async function POST(req: Request) {
  const user = await requireUser();
  const { examSectionId, answers } = await req.json();
  const section = await prisma.examSection.findUnique({ where: { id: examSectionId } });
  if (!section) return new NextResponse('Seção não encontrada', { status: 404 });
  if (user.role === 'TEACHER' && section.teacherOwnerId !== user.id) return new NextResponse('Sem permissão', { status: 403 });
  if (!Array.isArray(answers) || answers.length !== section.questionCount) return new NextResponse('Quantidade inválida', { status: 400 });

  await prisma.answerKey.upsert({ where: { examSectionId }, update: { answers, updatedByUserId: user.id }, create: { examSectionId, answers, updatedByUserId: user.id } });
  await prisma.auditLog.create({ data: { userId: user.id, entity: 'AnswerKey', entityId: examSectionId, action: 'UPSERT', changes: { answers } } });
  return NextResponse.json({ ok: true });
}
