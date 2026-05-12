import { NextResponse } from "next/server";

import { getCustomerSession } from "@/lib/auth";
import { listCustomerFavoriteIds, toggleCustomerFavorite } from "@/lib/server/accounts";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json({ favorites: [], authenticated: false }, { status: 200 });
  }

  try {
    const favorites = await listCustomerFavoriteIds(session.customerId);
    return NextResponse.json({ favorites, authenticated: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل المفضلة." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json({ message: "سجل الدخول أولاً." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { product_id?: string };
    const productId = body.product_id?.trim() ?? "";

    if (!productId) {
      return NextResponse.json({ message: "المنتج غير صالح." }, { status: 400 });
    }

    const result = await toggleCustomerFavorite(session.customerId, productId);
    return NextResponse.json({ active: result.active, message: result.active ? "تمت الإضافة للمفضلة." : "تمت الإزالة من المفضلة." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحديث المفضلة." },
      { status: 500 },
    );
  }
}
