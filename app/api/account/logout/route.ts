import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { CUSTOMER_COOKIE_NAME, getLongLivedAuthCookieOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_COOKIE_NAME, "", {
    ...getLongLivedAuthCookieOptions(),
    maxAge: 0,
  });

  return NextResponse.json({ message: "تم تسجيل الخروج." });
}
