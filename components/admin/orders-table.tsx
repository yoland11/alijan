import { MessageCircleMore, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { SERVICE_TYPE_LABELS } from "@/lib/constants";
import type { OrderRecord } from "@/lib/types";
import { formatDateOnly, formatDateTime } from "@/lib/utils";

interface OrdersTableProps {
  orders: OrderRecord[];
  onEdit: (order: OrderRecord) => void;
  onDelete: (order: OrderRecord) => void;
  onWhatsApp: (order: OrderRecord) => void;
}

export function OrdersTable({ orders, onEdit, onDelete, onWhatsApp }: OrdersTableProps) {
  if (!orders.length) {
    return (
      <div className="surface-panel p-10 text-center text-sm leading-8 text-ajn-muted">
        لا توجد طلبات مطابقة للفلاتر الحالية. يمكنك إنشاء أول طلب من الزر العلوي.
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-[28px] border border-ajn-line xl:block">
        <table className="w-full divide-y divide-white/6">
          <thead className="bg-white/[0.03] text-sm text-ajn-goldSoft">
            <tr>
              <th className="px-5 py-4 text-right font-semibold">العميل</th>
              <th className="px-5 py-4 text-right font-semibold">الكود</th>
              <th className="px-5 py-4 text-right font-semibold">الخدمة</th>
              <th className="px-5 py-4 text-right font-semibold">الحالة</th>
              <th className="px-5 py-4 text-right font-semibold">تاريخ الحجز</th>
              <th className="px-5 py-4 text-right font-semibold">آخر تحديث</th>
              <th className="px-5 py-4 text-right font-semibold">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6 bg-black/20">
            {orders.map((order) => (
              <tr key={order.id} className="transition hover:bg-white/[0.03]">
                <td className="px-5 py-4">
                  <div>
                    <p className="font-semibold text-white">{order.name}</p>
                    <p className="text-sm text-ajn-muted">{order.phone}</p>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-ajn-gold">{order.order_code}</td>
                <td className="px-5 py-4 text-sm text-ajn-ivory">
                  {SERVICE_TYPE_LABELS[order.service_type]}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-5 py-4 text-sm text-ajn-muted">{formatDateOnly(order.booking_date)}</td>
                <td className="px-5 py-4 text-sm text-ajn-muted">{formatDateTime(order.updated_at)}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="border-[#25D366]/35 bg-[#25D366]/10 px-3 py-2 text-[#b6f4cf] hover:bg-[#25D366]/16"
                      onClick={() => onWhatsApp(order)}
                    >
                      <MessageCircleMore className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" className="px-3 py-2" onClick={() => onEdit(order)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="danger" className="px-3 py-2" onClick={() => onDelete(order)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 xl:hidden">
        {orders.map((order) => (
          <div key={order.id} className="surface-panel p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">{order.name}</h3>
                <p className="text-sm text-ajn-muted">{order.order_code}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="grid gap-2 text-sm text-ajn-muted sm:grid-cols-2">
              <p>الخدمة: {SERVICE_TYPE_LABELS[order.service_type]}</p>
              <p>الهاتف: {order.phone}</p>
              <p>الحجز: {formatDateOnly(order.booking_date)}</p>
              <p>آخر تحديث: {formatDateTime(order.updated_at)}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1 border-[#25D366]/35 bg-[#25D366]/10 text-[#b6f4cf] hover:bg-[#25D366]/16"
                onClick={() => onWhatsApp(order)}
              >
                <MessageCircleMore className="h-4 w-4" />
                واتساب
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => onEdit(order)}>
                <Pencil className="h-4 w-4" />
                تعديل
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => onDelete(order)}>
                <Trash2 className="h-4 w-4" />
                حذف
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
