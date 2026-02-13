import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");

export type SessionUser = { id: string; schoolId: string; role: "ADMIN" | "TEACHER" | "VIEWER"; name: string; email: string };

export async function signSession(user: SessionUser) {
  return new SignJWT(user as Record<string, string>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get("session")?.value;
  if (!token) return null;
  try {
    const payload = await jwtVerify(token, secret);
    return payload.payload as unknown as SessionUser;
  } catch {
    return null;
  }
}
