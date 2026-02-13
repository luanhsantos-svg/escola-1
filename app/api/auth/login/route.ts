import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession, sessionCookieName } from '@/lib/auth';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)) || !user.active) return new NextResponse('Unauthorized', { status: 401 });
  const token = await createSession(user.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
  return res;
}
