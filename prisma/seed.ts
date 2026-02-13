import { PrismaClient, UserRole, ExamStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.studentResponse.deleteMany();
  await prisma.answerKey.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.examSection.deleteMany();
  await prisma.examClassroom.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.teacherAssignment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.discipline.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  const school = await prisma.school.create({ data: { name: 'Escola Modelo' } });
  const passwordHash = await bcrypt.hash('123456', 10);

  const [admin, profMat, profPort] = await Promise.all([
    prisma.user.create({ data: { name: 'Coordenação', email: 'admin@escola.com', role: UserRole.ADMIN, schoolId: school.id, passwordHash } }),
    prisma.user.create({ data: { name: 'Prof. Matemática', email: 'mat@escola.com', role: UserRole.TEACHER, schoolId: school.id, passwordHash } }),
    prisma.user.create({ data: { name: 'Prof. Português', email: 'port@escola.com', role: UserRole.TEACHER, schoolId: school.id, passwordHash } })
  ]);

  await prisma.user.create({ data: { name: 'Direção', email: 'viewer@escola.com', role: UserRole.VIEWER, schoolId: school.id, passwordHash } });

  const [mat, port, ciencias] = await Promise.all([
    prisma.discipline.create({ data: { name: 'Matemática' } }),
    prisma.discipline.create({ data: { name: 'Português' } }),
    prisma.discipline.create({ data: { name: 'Ciências' } })
  ]);

  const turma = await prisma.classroom.create({ data: { name: '6ºB', grade: 6, year: 2026, schoolId: school.id } });

  await prisma.student.createMany({ data: Array.from({ length: 35 }).map((_, i) => ({ fullName: `Aluno ${i + 1}`, classroomId: turma.id, registrationNumber: `REG${i + 1}` })) });

  await prisma.teacherAssignment.createMany({ data: [
    { teacherUserId: profMat.id, classroomId: turma.id, disciplineId: mat.id },
    { teacherUserId: profPort.id, classroomId: turma.id, disciplineId: port.id },
    { teacherUserId: profMat.id, classroomId: turma.id, disciplineId: ciencias.id }
  ] });

  await prisma.exam.create({
    data: {
      title: 'Provão 1º Bimestre',
      appliedAt: new Date('2026-03-25'),
      schoolYear: 2026,
      status: ExamStatus.OPEN,
      schoolId: school.id,
      classrooms: { create: { classroomId: turma.id } },
      sections: {
        create: [
          { disciplineId: mat.id, questionCount: 10, teacherOwnerId: profMat.id },
          { disciplineId: port.id, questionCount: 10, teacherOwnerId: profPort.id },
          { disciplineId: ciencias.id, questionCount: 10, teacherOwnerId: profMat.id }
        ]
      }
    }
  });

  console.log('Seed concluído: admin@escola.com / 123456');
}

main().finally(() => prisma.$disconnect());
