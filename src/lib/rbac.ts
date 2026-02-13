import { SessionUser } from "./auth";

export function canManage(user: SessionUser) {
  return user.role === "ADMIN";
}

export function canEditKey(user: SessionUser) {
  return user.role === "ADMIN" || user.role === "TEACHER";
}
