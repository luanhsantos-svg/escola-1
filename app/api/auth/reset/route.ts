import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const { token, newPassword } = await req.json();
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return new NextResponse('Token inválido', { status: 400 });
  await prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } });
  await prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
