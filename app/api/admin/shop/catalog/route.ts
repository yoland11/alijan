import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { listAdminCatalog } from "@/lib/server/shop";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const catalog = await listAdminCatalog();
    return NextResponse.json(catalog);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل البيانات." },
      { status: 500 },
    );
  }
}

