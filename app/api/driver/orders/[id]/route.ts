import { NextResponse } from "next/server";

import { getDriverSession } from "@/lib/auth";
import { getShopOrderById, updateShopOrderAdminState } from "@/lib/server/shop";
import type { ShopOrderStatus } from "@/lib/shop-types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const ALLOWED_DRIVER_STATUSES = new Set(["استلمت الطلب", "بالطريق", "تم التسليم"]);

export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: RouteContext) {
  const session = await getDriverSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string };
    const status = body.status?.trim() ?? "";

    if (!ALLOWED_DRIVER_STATUSES.has(status)) {
      return NextResponse.json({ message: "الحالة غير صالحة." }, { status: 400 });
    }

    const order = await getShopOrderById(id);

    if (!order || order.assigned_driver_id !== session.driverId) {
      return NextResponse.json({ message: "الطلب غير متاح للمندوب الحالي." }, { status: 404 });
    }

    const result = await updateShopOrderAdminState(id, {
      status: status as ShopOrderStatus,
      assigned_driver_id: undefined,
    });
    return NextResponse.json({ order: result.order, message: "تم تحديث الحالة." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحديث الحالة." },
      { status: 500 },
    );
  }
}
