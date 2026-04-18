import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { markOrderNotificationSent, createOrder, listOrders } from "@/lib/server/orders";
import { broadcastOrderUpdate } from "@/lib/supabase/realtime";
import { isWhatsAppAutomationConfigured, sendOrderCreatedNotification } from "@/lib/whatsapp";
import { orderSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const orders = await listOrders();
    return NextResponse.json({
      orders,
      meta: {
        whatsappAutomationEnabled: isWhatsAppAutomationConfigured(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل الطلبات." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = orderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات الطلب غير صالحة." },
        { status: 400 },
      );
    }

    const createdOrder = await createOrder(parsed.data);
    const notification = await sendOrderCreatedNotification(createdOrder);
    const order =
      notification.sent
        ? await markOrderNotificationSent(createdOrder.id, createdOrder.status)
        : createdOrder;
    await broadcastOrderUpdate(order);

    return NextResponse.json({ order, notification, message: "تم إنشاء الطلب." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر إنشاء الطلب." },
      { status: 500 },
    );
  }
}
