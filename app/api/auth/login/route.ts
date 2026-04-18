import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  ADMIN_COOKIE_NAME,
  getAuthCookieOptions,
  isValidAdminCredentials,
  signAdminToken,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات الدخول غير مكتملة." },
        { status: 400 },
      );
    }

    const isValid = await isValidAdminCredentials(parsed.data.username, parsed.data.password);

    if (!isValid) {
      return NextResponse.json({ message: "بيانات الدخول غير صحيحة." }, { status: 401 });
    }

    const token = await signAdminToken({
      role: "admin",
      username: parsed.data.username,
    });

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, getAuthCookieOptions());

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "تعذر تسجيل الدخول حاليًا." }, { status: 500 });
  }
}

