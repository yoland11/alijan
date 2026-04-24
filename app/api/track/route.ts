import { NextResponse } from "next/server";

import { findTrackingOrders } from "@/lib/server/orders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query =
      searchParams.get("code") ??
      searchParams.get("q") ??
      searchParams.get("query") ??
      "";

    if (!query.trim()) {
      return NextResponse.json(
        { message: "أدخل كود الطلب أو آخر 4 أرقام من الهاتف." },
        { status: 400 },
      );
    }

    const orders = await findTrackingOrders(query);

    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تنفيذ البحث." },
      { status: 500 },
    );
  }
}
