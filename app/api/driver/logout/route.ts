import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DRIVER_COOKIE_NAME, getLongLivedAuthCookieOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(DRIVER_COOKIE_NAME, "", {
    ...getLongLivedAuthCookieOptions(),
    maxAge: 0,
  });

  return NextResponse.json({ message: "تم تسجيل الخروج." });
}
