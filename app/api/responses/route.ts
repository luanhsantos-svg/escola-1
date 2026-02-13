import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { gradeSection } from '@/lib/correction';

export async function GET(req: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get('sectionId') || undefined;
  const classroomId = searchParams.get('classroomId') || undefined;

  const isSchoolWide = user.role === 'ADMIN' || user.role === 'VIEWER';
  const assignments = isSchoolWide ? [] : await prisma.teacherAssignment.findMany({ where: { teacherUserId: user.id } });
  const classrooms = await prisma.classroom.findMany({ where: isSchoolWide ? { schoolId: user.schoolId } : { id: { in: assignments.map((a) => a.classroomId) } } });
  const sections = await prisma.examSection.findMany({
    where:
      isSchoolWide
        ? { exam: { schoolId: user.schoolId } }
        : { exam: { schoolId: user.schoolId }, disciplineId: { in: assignments.map((a) => a.disciplineId) } },
    include: { exam: true, discipline: true }
  });

  const chosenSection = sectionId || sections[0]?.id;
  const chosenClassroom = classroomId || classrooms[0]?.id;
  if (!chosenSection || !chosenClassroom) return NextResponse.json({ sections: [], classrooms: [], students: [] });

  const [students, responses, attendance, key] = await Promise.all([
    prisma.student.findMany({ where: { classroomId: chosenClassroom, active: true }, orderBy: { fullName: 'asc' } }),
    prisma.studentResponse.findMany({ where: { examSectionId: chosenSection } }),
    prisma.examSection.findUnique({ where: { id: chosenSection }, include: { exam: true } }).then((s) => prisma.attendance.findMany({ where: { examId: s!.examId } })),
    prisma.answerKey.findUnique({ where: { examSectionId: chosenSection } })
  ]);

  return NextResponse.json({
    sections: sections.map((s) => ({ id: s.id, label: `${s.exam.title} - ${s.discipline.name}`, questionCount: s.questionCount })),
    classrooms: classrooms.map((c) => ({ id: c.id, name: c.name })),
    students: students.map((st) => {
      const resp = responses.find((r) => r.studentId === st.id);
      const att = attendance.find((a) => a.studentId === st.id)?.status || 'PRESENTE';
      const result = key ? gradeSection(key.answers as any, (resp?.answers as any) || []) : { totalCorrect: 0 };
      return { id: st.id, fullName: st.fullName, attendance: att, answers: (resp?.answers as string[] | undefined) || [], totalCorrect: result.totalCorrect };
    })
  });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (user.role === 'VIEWER') return new NextResponse('Somente leitura', { status: 403 });
  const { sectionId, studentId, answers, attendance } = await req.json();
  const section = await prisma.examSection.findUnique({ where: { id: sectionId } });
  if (!section) return new NextResponse('Seção inválida', { status: 400 });

  if (user.role === 'TEACHER') {
    const allowed = await prisma.teacherAssignment.findFirst({ where: { teacherUserId: user.id, disciplineId: section.disciplineId } });
    if (!allowed) return new NextResponse('Sem permissão', { status: 403 });
  }

  await prisma.studentResponse.upsert({ where: { examSectionId_studentId: { examSectionId: sectionId, studentId } }, update: { answers, updatedByUserId: user.id }, create: { examSectionId: sectionId, studentId, answers, updatedByUserId: user.id } });
  await prisma.attendance.upsert({ where: { examId_studentId: { examId: section.examId, studentId } }, update: { status: attendance }, create: { examId: section.examId, studentId, status: attendance } });
  await prisma.auditLog.create({ data: { userId: user.id, entity: 'StudentResponse', entityId: `${sectionId}:${studentId}`, action: 'UPSERT', changes: { answers, attendance } } });
  return NextResponse.json({ ok: true });
}
