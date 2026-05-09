import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { deleteServiceCategory, updateServiceCategory } from "@/lib/server/shop";
import { normalizeShopOptionalTextPayload, serviceCategorySchema } from "@/lib/shop-validators";

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
    const parsed = serviceCategorySchema.safeParse(normalizeShopOptionalTextPayload(body));

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات القسم غير صالحة." },
        { status: 400 },
      );
    }

    const category = await updateServiceCategory(id, parsed.data);
    return NextResponse.json({ category, message: "تم تحديث القسم." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحديث القسم." },
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
    await deleteServiceCategory(id);
    return NextResponse.json({ message: "تم حذف القسم." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حذف القسم." },
      { status: 500 },
    );
  }
}
