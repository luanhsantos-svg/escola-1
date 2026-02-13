-- Initial schema generated manually for production bootstrap.
CREATE TYPE "UserRole" AS ENUM ('ADMIN','TEACHER','VIEWER');
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT','OPEN','CLOSED');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENTE','FALTOU');

CREATE TABLE "School" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "User" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "email" TEXT NOT NULL UNIQUE, "passwordHash" TEXT NOT NULL, "role" "UserRole" NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true, "schoolId" TEXT NOT NULL REFERENCES "School"("id"), "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "TeacherProfile" ("userId" TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE, "phone" TEXT);
CREATE TABLE "Discipline" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL UNIQUE);
CREATE TABLE "Classroom" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "grade" INTEGER NOT NULL, "year" INTEGER NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true, "schoolId" TEXT NOT NULL REFERENCES "School"("id"));
CREATE TABLE "Student" ("id" TEXT PRIMARY KEY, "fullName" TEXT NOT NULL, "registrationNumber" TEXT, "active" BOOLEAN NOT NULL DEFAULT true, "classroomId" TEXT NOT NULL REFERENCES "Classroom"("id"));
CREATE TABLE "Exam" ("id" TEXT PRIMARY KEY, "title" TEXT NOT NULL, "appliedAt" TIMESTAMP NOT NULL, "schoolYear" INTEGER NOT NULL, "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT', "schoolId" TEXT NOT NULL REFERENCES "School"("id"));
CREATE TABLE "ExamClassroom" ("id" TEXT PRIMARY KEY, "examId" TEXT NOT NULL REFERENCES "Exam"("id") ON DELETE CASCADE, "classroomId" TEXT NOT NULL REFERENCES "Classroom"("id") ON DELETE CASCADE, UNIQUE("examId","classroomId"));
CREATE TABLE "ExamSection" ("id" TEXT PRIMARY KEY, "examId" TEXT NOT NULL REFERENCES "Exam"("id") ON DELETE CASCADE, "disciplineId" TEXT NOT NULL REFERENCES "Discipline"("id"), "questionCount" INTEGER NOT NULL, "allowedOptions" TEXT[] NOT NULL DEFAULT ARRAY['A','B','C','D','E']::TEXT[], "weight" DOUBLE PRECISION, "teacherOwnerId" TEXT NOT NULL REFERENCES "User"("id"), UNIQUE("examId","disciplineId"));
CREATE TABLE "AnswerKey" ("id" TEXT PRIMARY KEY, "examSectionId" TEXT NOT NULL UNIQUE REFERENCES "ExamSection"("id") ON DELETE CASCADE, "answers" JSONB NOT NULL, "updatedByUserId" TEXT NOT NULL REFERENCES "User"("id"), "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "Attendance" ("id" TEXT PRIMARY KEY, "examId" TEXT NOT NULL REFERENCES "Exam"("id") ON DELETE CASCADE, "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE, "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENTE', UNIQUE("examId","studentId"));
CREATE TABLE "StudentResponse" ("id" TEXT PRIMARY KEY, "examSectionId" TEXT NOT NULL REFERENCES "ExamSection"("id") ON DELETE CASCADE, "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE, "answers" JSONB NOT NULL, "updatedByUserId" TEXT NOT NULL REFERENCES "User"("id"), "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE("examSectionId","studentId"));
CREATE TABLE "TeacherAssignment" ("id" TEXT PRIMARY KEY, "teacherUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "classroomId" TEXT NOT NULL REFERENCES "Classroom"("id") ON DELETE CASCADE, "disciplineId" TEXT NOT NULL REFERENCES "Discipline"("id") ON DELETE CASCADE, UNIQUE("teacherUserId","classroomId","disciplineId"));
CREATE TABLE "PasswordResetToken" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "token" TEXT NOT NULL UNIQUE, "expiresAt" TIMESTAMP NOT NULL, "usedAt" TIMESTAMP);
CREATE TABLE "AuditLog" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "entity" TEXT NOT NULL, "entityId" TEXT NOT NULL, "action" TEXT NOT NULL, "changes" JSONB NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP);
