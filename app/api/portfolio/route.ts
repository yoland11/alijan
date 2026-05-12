import { NextResponse } from "next/server";

import { listPortfolioEntries } from "@/lib/server/shop";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const entries = await listPortfolioEntries(true);
    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل الأعمال." },
      { status: 500 },
    );
  }
}
