import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user || !user.active) return NextResponse.json({ error: "invalid" }, { status: 401 });
  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "invalid" }, { status: 401 });

  const token = await signSession({ id: user.id, schoolId: user.schoolId, role: user.role, name: user.name, email: user.email });
  const response = NextResponse.json({ ok: true });
  response.cookies.set("session", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  return response;
}
