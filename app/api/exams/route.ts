import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function POST(req: Request) {
  const user = await requireRole(['ADMIN']);
  const form = await req.formData();
  const title = String(form.get('title'));
  const appliedAt = new Date(String(form.get('appliedAt')));
  const schoolYear = Number(form.get('schoolYear'));
  const status = String(form.get('status')) as 'DRAFT' | 'OPEN' | 'CLOSED';
  const classrooms = form.getAll('classrooms').map(String);
  const sectionsRaw = String(form.get('sections') || '').split('\n').filter(Boolean);

  const exam = await prisma.exam.create({
    data: {
      title, appliedAt, schoolYear, status, schoolId: user.schoolId,
      classrooms: { create: classrooms.map((classroomId) => ({ classroomId })) },
      sections: { create: sectionsRaw.map((line) => { const [disciplineId, q, teacherOwnerId] = line.split('|'); return { disciplineId, questionCount: Number(q || 10), teacherOwnerId }; }) }
    }
  });

  await prisma.auditLog.create({ data: { userId: user.id, entity: 'Exam', entityId: exam.id, action: 'CREATE', changes: { title } } });
  return NextResponse.redirect(new URL('/app/provas', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
}
