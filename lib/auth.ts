import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';

const COOKIE_NAME = 'escola_session';

function secretKey() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret');
}

export async function createSession(userId: string) {
  return await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('12h')
    .sign(secretKey());
}

export async function getSessionUser() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    return prisma.user.findUnique({ where: { id: payload.sub as string } });
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user || !user.active) redirect('/login');
  return user;
}

export async function requireRole(roles: Array<'ADMIN' | 'TEACHER' | 'VIEWER'>) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect('/app/dashboard');
  return user;
}

export const sessionCookieName = COOKIE_NAME;
