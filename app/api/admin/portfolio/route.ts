import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { createPortfolioEntry, listPortfolioEntries } from "@/lib/server/shop";
import { normalizeShopOptionalTextPayload, portfolioEntrySchema } from "@/lib/shop-validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const entries = await listPortfolioEntries(false);
    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل الأعمال." },
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
    const parsed = portfolioEntrySchema.safeParse(normalizeShopOptionalTextPayload(body));

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات العمل غير صالحة." },
        { status: 400 },
      );
    }

    const entry = await createPortfolioEntry(parsed.data);
    return NextResponse.json({ entry, message: "تم حفظ العمل." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حفظ العمل." },
      { status: 500 },
    );
  }
}
