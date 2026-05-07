import { NextResponse } from "next/server";

import { createOrder } from "@/lib/server/orders";
import { broadcastOrderUpdate } from "@/lib/supabase/realtime";
import { getInitialStatusForService } from "@/lib/utils";
import { customerBookingSchema, orderSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customerPayload = customerBookingSchema.safeParse(body);

    if (!customerPayload.success) {
      return NextResponse.json(
        { message: customerPayload.error.issues[0]?.message || "بيانات الحجز غير صالحة." },
        { status: 400 },
      );
    }

    const preparedOrder = orderSchema.safeParse({
      ...customerPayload.data,
      status: getInitialStatusForService(customerPayload.data.service_type),
      images: [],
      total_amount: 0,
      received_amount: 0,
    });

    if (!preparedOrder.success) {
      return NextResponse.json(
        { message: preparedOrder.error.issues[0]?.message || "تعذر تجهيز الحجز." },
        { status: 400 },
      );
    }

    const order = await createOrder(preparedOrder.data);
    await broadcastOrderUpdate(order);

    return NextResponse.json(
      { order, message: "تم إرسال الحجز بنجاح." },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر إرسال الحجز." },
      { status: 500 },
    );
  }
}
