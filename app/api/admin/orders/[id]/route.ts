import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { deleteOrder, updateOrder } from "@/lib/server/orders";
import { broadcastOrderUpdate, broadcastOrdersRefresh } from "@/lib/supabase/realtime";
import { orderSchema } from "@/lib/validators";

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
    const parsed = orderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات الطلب غير صالحة." },
        { status: 400 },
      );
    }

    const order = await updateOrder(id, parsed.data);
    await broadcastOrderUpdate(order);

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
    await deleteOrder(id);
    await broadcastOrdersRefresh("delete");

    return NextResponse.json({ message: "تم حذف الطلب." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حذف الطلب." },
      { status: 500 },
    );
  }
}
