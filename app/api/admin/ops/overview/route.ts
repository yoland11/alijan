import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { getOperationsOverview } from "@/lib/server/operations";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const overview = await getOperationsOverview();
    return NextResponse.json({ overview });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل نظرة العمليات." },
      { status: 500 },
    );
  }
}
