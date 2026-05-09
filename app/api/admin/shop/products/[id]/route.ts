import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { deleteProduct, updateProduct } from "@/lib/server/shop";
import { normalizeShopOptionalTextPayload, productSchema } from "@/lib/shop-validators";

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
    const parsed = productSchema.safeParse(normalizeShopOptionalTextPayload(body));

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات المنتج غير صالحة." },
        { status: 400 },
      );
    }

    const product = await updateProduct(id, parsed.data);
    return NextResponse.json({ product, message: "تم تحديث المنتج." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحديث المنتج." },
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
    await deleteProduct(id);
    return NextResponse.json({ message: "تم حذف المنتج." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حذف المنتج." },
      { status: 500 },
    );
  }
}
