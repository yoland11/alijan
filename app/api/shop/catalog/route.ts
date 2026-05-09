import { NextResponse } from "next/server";

import { listShopCatalog } from "@/lib/server/shop";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = await listShopCatalog();
    return NextResponse.json(catalog);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل الخدمات." },
      { status: 500 },
    );
  }
}

