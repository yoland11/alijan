import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { createManualCustomerNotification } from "@/lib/server/accounts";
import { customerNotificationAdminSchema } from "@/lib/shop-validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = customerNotificationAdminSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات الإشعار غير صالحة." },
        { status: 400 },
      );
    }

    const notification = await createManualCustomerNotification(parsed.data);
    return NextResponse.json({ notification, message: "تم إرسال الإشعار." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر إرسال الإشعار." },
      { status: 500 },
    );
  }
}
