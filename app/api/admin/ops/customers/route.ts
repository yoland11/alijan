import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { listCustomerInsights } from "@/lib/server/operations";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const customers = await listCustomerInsights();
    return NextResponse.json({ customers });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل العملاء." },
      { status: 500 },
    );
  }
}
