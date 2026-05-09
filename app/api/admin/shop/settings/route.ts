import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { getOrCreateShopSettings, updateShopSettings } from "@/lib/server/shop";
import { normalizeShopOptionalTextPayload, shopSettingsSchema } from "@/lib/shop-validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const settings = await getOrCreateShopSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل الإعدادات." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = shopSettingsSchema.safeParse(normalizeShopOptionalTextPayload(body));

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات الإعدادات غير صالحة." },
        { status: 400 },
      );
    }

    const settings = await updateShopSettings(parsed.data);
    return NextResponse.json({ settings, message: "تم حفظ الإعدادات." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حفظ الإعدادات." },
      { status: 500 },
    );
  }
}
