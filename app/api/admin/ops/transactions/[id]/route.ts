import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { deleteCashTransaction } from "@/lib/server/operations";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: Context) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deleteCashTransaction(id);
    return NextResponse.json({ message: "تم حذف الحركة." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حذف الحركة المالية." },
      { status: 500 },
    );
  }
}
