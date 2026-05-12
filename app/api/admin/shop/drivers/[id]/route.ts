import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { deleteDeliveryAgent, updateDeliveryAgent } from "@/lib/server/accounts";
import { deliveryAgentSchema } from "@/lib/shop-validators";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: RouteContext) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = deliveryAgentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات المندوب غير صالحة." },
        { status: 400 },
      );
    }

    const driver = await updateDeliveryAgent(id, parsed.data);
    return NextResponse.json({ driver, message: "تم تحديث المندوب." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحديث المندوب." },
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
    await deleteDeliveryAgent(id);
    return NextResponse.json({ message: "تم حذف المندوب." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حذف المندوب." },
      { status: 500 },
    );
  }
}
