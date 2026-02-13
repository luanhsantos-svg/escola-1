import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  const { email } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (user) {
    const token = randomUUID();
    await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt: new Date(Date.now() + 1000 * 60 * 30) } });
    console.log(`Reset token for ${email}: ${token}`);
  }
  return NextResponse.json({ ok: true });
}
