import { NextResponse } from "next/server";

import { getCustomerSession } from "@/lib/auth";
import { listCustomerNotifications, markCustomerNotificationsRead } from "@/lib/server/accounts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json({ notifications: [] }, { status: 200 });
  }

  try {
    const unreadOnly = new URL(request.url).searchParams.get("unread") === "1";
    const notifications = await listCustomerNotifications(session.customerId, unreadOnly);
    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل الإشعارات." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { ids?: string[] };
    await markCustomerNotificationsRead(session.customerId, Array.isArray(body.ids) ? body.ids : undefined);
    return NextResponse.json({ message: "تم تحديث الإشعارات." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحديث الإشعارات." },
      { status: 500 },
    );
  }
}
