import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { getBookingCalendarSnapshot } from "@/lib/server/operations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") ?? undefined;
    const snapshot = await getBookingCalendarSnapshot(month);
    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل التقويم." },
      { status: 500 },
    );
  }
}
