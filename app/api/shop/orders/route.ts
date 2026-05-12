import { NextResponse } from "next/server";

import { getCustomerSession } from "@/lib/auth";
import { createShopOrder } from "@/lib/server/shop";
import { checkoutOrderSchema, normalizeShopOptionalTextPayload } from "@/lib/shop-validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const customerSession = await getCustomerSession();
    const body = await request.json();
    const parsed = checkoutOrderSchema.safeParse(normalizeShopOptionalTextPayload(body));

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات الطلب غير صالحة." },
        { status: 400 },
      );
    }

    const order = await createShopOrder({
      ...parsed.data,
      customer_user_id: customerSession?.customerId ?? parsed.data.customer_user_id ?? "",
    });
    return NextResponse.json({ order, message: "تم إتمام الطلب." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر إتمام الطلب." },
      { status: 500 },
    );
  }
}
