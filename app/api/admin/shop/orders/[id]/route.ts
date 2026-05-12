import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { deleteShopOrder, updateShopOrderAdminState } from "@/lib/server/shop";
import { shopOrderAdminUpdateSchema } from "@/lib/shop-validators";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = shopOrderAdminUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات التحديث غير صالحة." },
        { status: 400 },
      );
    }

    const result = await updateShopOrderAdminState(id, parsed.data);
    const message =
      parsed.data.status === "ملغي" && result.inventoryAction === "restored"
        ? "تم إلغاء الطلب وإرجاع الكمية للمخزن."
        : parsed.data.status !== undefined && result.inventoryAction === "reserved"
          ? "تمت إعادة تفعيل الطلب وخصم الكمية من المخزن."
          : "تم تحديث الطلب.";

    return NextResponse.json({ order: result.order, message, inventoryAction: result.inventoryAction });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحديث الطلب." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const result = await deleteShopOrder(id);
    const message =
      result.inventoryAction === "restored"
        ? "تم حذف الطلب وإرجاع الكميات للمخزن."
        : "تم حذف الطلب.";
    return NextResponse.json({ message, inventoryAction: result.inventoryAction });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حذف الطلب." },
      { status: 500 },
    );
  }
}
