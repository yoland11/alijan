import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

import type { AdminTokenPayload } from "@/lib/types";

export const ADMIN_COOKIE_NAME = "ajn_admin_session";

function getAuthSecret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "ajn-local-dev-secret-change-me",
  );
}

export async function signAdminToken(payload: AdminTokenPayload) {
  return new SignJWT({
    role: payload.role,
    username: payload.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setSubject(payload.username)
    .setExpirationTime("12h")
    .sign(getAuthSecret());
}

export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());

    if (payload.role !== "admin" || typeof payload.username !== "string") {
      return null;
    }

    return {
      role: "admin",
      username: payload.username,
    } satisfies AdminTokenPayload;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyAdminToken(token);
}

export async function isValidAdminCredentials(
  username: string,
  password: string,
) {
  const expectedUsername = process.env.ADMIN_USERNAME?.trim();
  const hashedPassword = process.env.ADMIN_PASSWORD_HASH?.trim();
  const plainPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!expectedUsername || (!hashedPassword && !plainPassword)) {
    return false;
  }

  if (username.trim() !== expectedUsername) {
    return false;
  }

  if (hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  return password === plainPassword;
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 12,
  };
}
