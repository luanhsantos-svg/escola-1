import { NextResponse } from 'next/server';
import { sessionCookieName } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  res.cookies.set(sessionCookieName, '', { expires: new Date(0), path: '/' });
  return res;
}
