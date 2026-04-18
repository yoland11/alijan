import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { SERVICE_TYPE_LABELS } from "@/lib/constants";
import { listOrders } from "@/lib/server/orders";
import { escapeCsvValue, formatDateOnly, formatDateTime, isArchivedOrder } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") ?? "").trim().toLowerCase();
    const status = (searchParams.get("status") ?? "الكل").trim();
    const archive = (searchParams.get("archive") ?? "النشطة").trim();

    const orders = await listOrders();
    const filteredOrders = orders.filter((order) => {
      const matchesSearch =
        !search ||
        [
          order.name,
          order.phone,
          order.order_code,
          order.notes,
          order.portal_message,
          order.delivery_details,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);
      const matchesStatus = status === "الكل" || order.status === status;
      const matchesArchive =
        archive === "الكل" ||
        (archive === "المؤرشفة" ? isArchivedOrder(order) : !isArchivedOrder(order));

      return matchesSearch && matchesStatus && matchesArchive;
    });

    const header = [
      "كود الطلب",
      "العميل",
      "الهاتف",
      "الخدمة",
      "الحالة",
      "تاريخ الحجز",
      "موعد التسليم المتوقع",
      "رسالة العميل",
      "تعليمات التسليم",
      "عدد الصور",
      "آخر إشعار واتساب",
      "حالة الإشعار الأخيرة",
      "مؤرشف",
      "آخر تحديث",
      "تاريخ الإنشاء",
      "سجل الحالات",
    ];

    const rows = filteredOrders.map((order) =>
      [
        order.order_code,
        order.name,
        order.phone,
        SERVICE_TYPE_LABELS[order.service_type],
        order.status,
        formatDateOnly(order.booking_date),
        order.estimated_delivery_date ? formatDateOnly(order.estimated_delivery_date) : "",
        order.portal_message,
        order.delivery_details,
        order.images.length,
        order.last_notification_at ? formatDateTime(order.last_notification_at) : "",
        order.last_notification_status ?? "",
        isArchivedOrder(order) ? "نعم" : "لا",
        formatDateTime(order.updated_at),
        formatDateTime(order.created_at),
        order.status_history.map((item) => `${item.status} - ${item.note} - ${formatDateTime(item.timestamp)}`).join(" | "),
      ]
        .map((value) => escapeCsvValue(value))
        .join(","),
    );

    const csv = `\uFEFF${header.map((value) => escapeCsvValue(value)).join(",")}\n${rows.join("\n")}`;
    const fileDate = new Date().toISOString().split("T")[0];

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ajn-orders-${fileDate}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تصدير البيانات." },
      { status: 500 },
    );
  }
}
