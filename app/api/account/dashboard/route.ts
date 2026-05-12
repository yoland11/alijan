import { NextResponse } from "next/server";

import { getCustomerSession } from "@/lib/auth";
import { getCustomerAccountDashboard } from "@/lib/server/accounts";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const dashboard = await getCustomerAccountDashboard(session.customerId);
    return NextResponse.json(dashboard);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل الحساب." },
      { status: 500 },
    );
  }
}
