import { NextResponse } from "next/server";

import { findTrackingOrders } from "@/lib/server/orders";
import { trackingQuerySchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = trackingQuerySchema.safeParse({
      query: searchParams.get("query") ?? "",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "أدخل بيانات البحث بشكل صحيح." },
        { status: 400 },
      );
    }

    const orders = await findTrackingOrders(parsed.data.query);
    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تنفيذ البحث." },
      { status: 500 },
    );
  }
}
