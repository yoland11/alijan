import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { CUSTOMER_COOKIE_NAME, getLongLivedAuthCookieOptions, signCustomerToken } from "@/lib/auth";
import { verifyCustomerCredentials } from "@/lib/server/accounts";
import { customerLoginSchema } from "@/lib/shop-validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = customerLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات الدخول غير صالحة." },
        { status: 400 },
      );
    }

    const customer = await verifyCustomerCredentials(parsed.data);

    if (!customer) {
      return NextResponse.json({ message: "بيانات الدخول غير صحيحة." }, { status: 401 });
    }

    const token = await signCustomerToken({
      role: "customer",
      customerId: customer.id,
      phone: customer.phone,
      email: customer.email,
      fullName: customer.full_name,
    });

    const cookieStore = await cookies();
    cookieStore.set(CUSTOMER_COOKIE_NAME, token, getLongLivedAuthCookieOptions());

    return NextResponse.json({ customer, message: "تم تسجيل الدخول." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تسجيل الدخول." },
      { status: 500 },
    );
  }
}
