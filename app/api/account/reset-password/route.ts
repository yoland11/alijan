import { NextResponse } from "next/server";

import { resetCustomerPassword } from "@/lib/server/accounts";
import { customerResetPasswordSchema } from "@/lib/shop-validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = customerResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات الاستعادة غير صالحة." },
        { status: 400 },
      );
    }

    const customer = await resetCustomerPassword(parsed.data);
    return NextResponse.json({ customer, message: "تم تحديث كلمة المرور." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحديث كلمة المرور." },
      { status: 500 },
    );
  }
}
