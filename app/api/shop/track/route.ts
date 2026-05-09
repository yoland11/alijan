import { NextResponse } from "next/server";

import { searchShopOrders } from "@/lib/server/shop";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") ?? "";
    const orders = await searchShopOrders(query);

    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر إتمام البحث." },
      { status: 500 },
    );
  }
}
