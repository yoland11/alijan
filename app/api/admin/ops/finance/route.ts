import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { getFinanceSnapshot } from "@/lib/server/operations";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const snapshot = await getFinanceSnapshot();
    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل الصندوق." },
      { status: 500 },
    );
  }
}
