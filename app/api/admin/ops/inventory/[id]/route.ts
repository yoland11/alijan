import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { inventoryItemSchema } from "@/lib/operations-validators";
import { deleteInventoryItem, updateInventoryItem } from "@/lib/server/operations";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: Context) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = inventoryItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات المادة غير صالحة." },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const item = await updateInventoryItem(id, parsed.data);
    return NextResponse.json({ item, message: "تم تحديث المادة." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحديث المادة." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deleteInventoryItem(id);
    return NextResponse.json({ message: "تم حذف المادة." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حذف المادة." },
      { status: 500 },
    );
  }
}
