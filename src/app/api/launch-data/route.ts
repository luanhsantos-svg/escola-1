import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const classroomId = searchParams.get("classroomId");
  if (!classroomId) return NextResponse.json({ students: [] });
  const students = await prisma.student.findMany({ where: { classroomId, active: true }, orderBy: { fullName: "asc" } });
  return NextResponse.json({ students });
}
