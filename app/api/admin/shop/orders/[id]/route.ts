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

    const order = await updateShopOrderAdminState(id, parsed.data);
    return NextResponse.json({ order, message: "تم تحديث الطلب." });
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
    await deleteShopOrder(id);
    return NextResponse.json({ message: "تم حذف الطلب." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حذف الطلب." },
      { status: 500 },
    );
  }
}
