import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { createProduct } from "@/lib/server/shop";
import { normalizeShopOptionalTextPayload, productSchema } from "@/lib/shop-validators";

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = productSchema.safeParse(normalizeShopOptionalTextPayload(body));

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات المنتج غير صالحة." },
        { status: 400 },
      );
    }

    const product = await createProduct(parsed.data);
    return NextResponse.json({ product, message: "تم حفظ المنتج." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حفظ المنتج." },
      { status: 500 },
    );
  }
}
