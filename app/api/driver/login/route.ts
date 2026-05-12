import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DRIVER_COOKIE_NAME, getLongLivedAuthCookieOptions, signDriverToken } from "@/lib/auth";
import { verifyDeliveryAgentCredentials } from "@/lib/server/accounts";
import { deliveryAgentLoginSchema } from "@/lib/shop-validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = deliveryAgentLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات الدخول غير صالحة." },
        { status: 400 },
      );
    }

    const driver = await verifyDeliveryAgentCredentials(parsed.data);

    if (!driver) {
      return NextResponse.json({ message: "بيانات الدخول غير صحيحة." }, { status: 401 });
    }

    const token = await signDriverToken({
      role: "driver",
      driverId: driver.id,
      username: driver.username,
      name: driver.name,
    });

    const cookieStore = await cookies();
    cookieStore.set(DRIVER_COOKIE_NAME, token, getLongLivedAuthCookieOptions());

    return NextResponse.json({ driver, message: "تم تسجيل دخول المندوب." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تسجيل الدخول." },
      { status: 500 },
    );
  }
}
