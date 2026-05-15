import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { cashTransactionSchema } from "@/lib/operations-validators";
import { createCashTransaction } from "@/lib/server/operations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = cashTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات الحركة المالية غير صالحة." },
        { status: 400 },
      );
    }

    const transaction = await createCashTransaction(parsed.data);
    return NextResponse.json({ transaction, message: "تم حفظ الحركة." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حفظ الحركة المالية." },
      { status: 500 },
    );
  }
}
