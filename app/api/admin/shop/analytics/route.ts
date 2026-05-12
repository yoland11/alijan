import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { getShopAnalyticsSnapshot } from "@/lib/server/accounts";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const analytics = await getShopAnalyticsSnapshot();
    return NextResponse.json({ analytics });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل الإحصائيات." },
      { status: 500 },
    );
  }
}
