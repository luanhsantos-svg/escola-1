import { PrismaClient, UserRole, ExamStatus, AttendanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

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
  await prisma.teacherProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  const school = await prisma.school.create({ data: { name: "Escola Exemplo" } });
  const passwordHash = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.create({
    data: { schoolId: school.id, name: "Coordenação", email: "admin@escola.com", passwordHash, role: UserRole.ADMIN }
  });

  const teacherMath = await prisma.user.create({
    data: { schoolId: school.id, name: "Prof. Matemática", email: "math@escola.com", passwordHash, role: UserRole.TEACHER }
  });

  const teacherPort = await prisma.user.create({
    data: { schoolId: school.id, name: "Prof. Português", email: "port@escola.com", passwordHash, role: UserRole.TEACHER }
  });

  const viewer = await prisma.user.create({
    data: { schoolId: school.id, name: "Direção", email: "viewer@escola.com", passwordHash, role: UserRole.VIEWER }
  });

  await prisma.teacherProfile.createMany({
    data: [
      { userId: teacherMath.id, phone: "(11) 99999-0001" },
      { userId: teacherPort.id, phone: "(11) 99999-0002" }
    ]
  });

  const [mat, port, cien] = await Promise.all([
    prisma.discipline.create({ data: { name: "Matemática" } }),
    prisma.discipline.create({ data: { name: "Português" } }),
    prisma.discipline.create({ data: { name: "Ciências" } })
  ]);

  const classroom = await prisma.classroom.create({
    data: { schoolId: school.id, name: "6ºB", grade: 6, year: 2026 }
  });

  await prisma.student.createMany({
    data: Array.from({ length: 30 }).map((_, i) => ({
      classroomId: classroom.id,
      fullName: `Aluno ${String(i + 1).padStart(2, "0")}`,
      registrationNumber: `REG${1000 + i}`
    }))
  });

  await prisma.teacherAssignment.createMany({
    data: [
      { teacherUserId: teacherMath.id, classroomId: classroom.id, disciplineId: mat.id },
      { teacherUserId: teacherPort.id, classroomId: classroom.id, disciplineId: port.id },
      { teacherUserId: teacherMath.id, classroomId: classroom.id, disciplineId: cien.id }
    ]
  });

  const exam = await prisma.exam.create({
    data: {
      schoolId: school.id,
      title: "Provão 1º Bimestre",
      appliedAt: new Date("2026-04-10"),
      schoolYear: 2026,
      status: ExamStatus.OPEN,
      classrooms: { create: [{ classroomId: classroom.id }] }
    }
  });

  const sectionMat = await prisma.examSection.create({
    data: { examId: exam.id, disciplineId: mat.id, questionCount: 12, allowedOptions: ["A", "B", "C", "D", "E"], teacherOwnerId: teacherMath.id }
  });

  const sectionPort = await prisma.examSection.create({
    data: { examId: exam.id, disciplineId: port.id, questionCount: 10, allowedOptions: ["A", "B", "C", "D", "E"], teacherOwnerId: teacherPort.id }
  });

  await prisma.answerKey.createMany({
    data: [
      { examSectionId: sectionMat.id, answers: ["A", "B", "C", "D", "E", "A", "B", "C", "D", "E", "A", "B"], updatedByUserId: teacherMath.id },
      { examSectionId: sectionPort.id, answers: ["B", "B", "A", "C", "D", "E", "A", "A", "D", "B"], updatedByUserId: teacherPort.id }
    ]
  });

  const students = await prisma.student.findMany({ where: { classroomId: classroom.id } });
  await prisma.attendance.createMany({ data: students.map((s, idx) => ({ examId: exam.id, studentId: s.id, status: idx % 8 === 0 ? AttendanceStatus.FALTOU : AttendanceStatus.PRESENTE })) });

  console.log({ admin: admin.email, teacherMath: teacherMath.email, teacherPort: teacherPort.email, viewer: viewer.email });
}

main().finally(async () => prisma.$disconnect());
