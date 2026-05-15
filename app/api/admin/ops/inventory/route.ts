import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { inventoryItemSchema, inventoryMovementSchema } from "@/lib/operations-validators";
import { createInventoryItem, createInventoryMovement, listInventoryItems } from "@/lib/server/operations";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const items = await listInventoryItems();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل المخزون." },
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

    if (body?.action === "movement") {
      const parsedMovement = inventoryMovementSchema.safeParse(body.payload ?? body);
      if (!parsedMovement.success) {
        return NextResponse.json(
          { message: parsedMovement.error.issues[0]?.message || "حركة المادة غير صالحة." },
          { status: 400 },
        );
      }

      const movement = await createInventoryMovement(parsedMovement.data);
      return NextResponse.json({ movement, message: "تم تسجيل الحركة." }, { status: 201 });
    }

    const parsed = inventoryItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات المادة غير صالحة." },
        { status: 400 },
      );
    }

    const item = await createInventoryItem(parsed.data);
    return NextResponse.json({ item, message: "تمت إضافة المادة." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حفظ بيانات المخزون." },
      { status: 500 },
    );
  }
}
