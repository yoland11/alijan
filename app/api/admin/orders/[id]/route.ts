import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import {
  archiveOrder,
  deleteOrder,
  getOrderById,
  markOrderNotificationSent,
  updateOrder,
} from "@/lib/server/orders";
import { broadcastOrderUpdate, broadcastOrdersRefresh } from "@/lib/supabase/realtime";
import { sendOrderStatusChangedNotification } from "@/lib/whatsapp";
import { archiveActionSchema, orderSchema } from "@/lib/validators";

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
    const previousOrder = await getOrderById(id);

    if (!previousOrder) {
      return NextResponse.json({ message: "الطلب غير موجود." }, { status: 404 });
    }

    const body = await request.json();
    const parsed = orderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات الطلب غير صالحة." },
        { status: 400 },
      );
    }

    const updatedOrder = await updateOrder(id, parsed.data, previousOrder);
    const notification =
      previousOrder.status !== updatedOrder.status
        ? await sendOrderStatusChangedNotification(updatedOrder, previousOrder.status)
        : {
            attempted: false,
            sent: false,
          };
    const order =
      notification.sent
        ? await markOrderNotificationSent(updatedOrder.id, updatedOrder.status)
        : updatedOrder;
    await broadcastOrderUpdate(order);

    return NextResponse.json({ order, notification, message: "تم تحديث الطلب." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحديث الطلب." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = archiveActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "إجراء الأرشفة غير صالح." }, { status: 400 });
    }

    const order = await archiveOrder(id, parsed.data.action === "archive");
    await broadcastOrderUpdate(order);

    return NextResponse.json({
      order,
      message: parsed.data.action === "archive" ? "تمت أرشفة الطلب." : "تمت إعادة الطلب إلى النشطة.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحديث الأرشفة." },
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
