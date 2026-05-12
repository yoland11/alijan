import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { deletePortfolioEntry, updatePortfolioEntry } from "@/lib/server/shop";
import { normalizeShopOptionalTextPayload, portfolioEntrySchema } from "@/lib/shop-validators";

export async function PUT(request: Request, context: { params: Promise<unknown> }) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const { id } = (await context.params) as { id: string };
    const body = await request.json();
    const parsed = portfolioEntrySchema.safeParse(normalizeShopOptionalTextPayload(body));

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات العمل غير صالحة." },
        { status: 400 },
      );
    }

    const entry = await updatePortfolioEntry(id, parsed.data);
    return NextResponse.json({ entry, message: "تم تحديث العمل." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحديث العمل." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<unknown> }) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const { id } = (await context.params) as { id: string };
    await deletePortfolioEntry(id);
    return NextResponse.json({ message: "تم حذف العمل." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حذف العمل." },
      { status: 500 },
    );
  }
}
