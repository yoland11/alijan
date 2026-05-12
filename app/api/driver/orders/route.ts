import { NextResponse } from "next/server";

import { getDriverSession } from "@/lib/auth";
import { listDriverAssignedOrders } from "@/lib/server/accounts";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getDriverSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const orders = await listDriverAssignedOrders(session.driverId);
    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل الطلبات." },
      { status: 500 },
    );
  }
}
