import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { listShopOrders } from "@/lib/server/shop";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const orders = await listShopOrders();
    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل طلبات المتجر." },
      { status: 500 },
    );
  }
}

