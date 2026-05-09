import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { createServiceCategory } from "@/lib/server/shop";
import { normalizeShopOptionalTextPayload, serviceCategorySchema } from "@/lib/shop-validators";

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = serviceCategorySchema.safeParse(normalizeShopOptionalTextPayload(body));

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات القسم غير صالحة." },
        { status: 400 },
      );
    }

    const category = await createServiceCategory(parsed.data);
    return NextResponse.json({ category, message: "تم حفظ القسم." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حفظ القسم." },
      { status: 500 },
    );
  }
}
