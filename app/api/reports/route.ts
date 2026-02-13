import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { gradeSection } from '@/lib/correction';

export async function GET(req: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get('examId');
  if (!examId) return new NextResponse('examId obrigatório', { status: 400 });

  const exam = await prisma.exam.findFirst({ where: { id: examId, schoolId: user.schoolId }, include: { sections: { include: { discipline: true, answerKey: true, responses: true } } } });
  if (!exam) return new NextResponse('não encontrado', { status: 404 });
  const students = await prisma.student.findMany({ where: { classroom: { examClassrooms: { some: { examId } } } }, include: { classroom: true } });

  let csv = 'Aluno,Turma,Disciplina,Acertos,Percentual\n';
  for (const student of students) {
    for (const s of exam.sections) {
      const response = s.responses.find((r) => r.studentId === student.id);
      const key = (s.answerKey?.answers as string[]) || [];
      const result = gradeSection(key as any, ((response?.answers as string[]) || []) as any);
      csv += `${student.fullName},${student.classroom.name},${s.discipline.name},${result.totalCorrect},${result.scorePercent}%\n`;
    }
  }

  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="relatorio-${exam.title}.csv"` } });
}
