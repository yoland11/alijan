import { CheckCircle2, MessageCircleMore, Pencil, Printer, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { SERVICE_TYPE_LABELS } from "@/lib/constants";
import type { OrderRecord } from "@/lib/types";
import {
  formatAmountWithCurrency,
  formatDateOnly,
  formatDateTime,
  getStaffFieldLabel,
  getOrderStatusLabel,
} from "@/lib/utils";

interface OrdersTableProps {
  orders: OrderRecord[];
  onEdit: (order: OrderRecord) => void;
  onDelete: (order: OrderRecord) => void;
  onTrackingWhatsApp: (order: OrderRecord) => void;
  onCompletionWhatsApp: (order: OrderRecord) => void;
  onPrintInvoice: (order: OrderRecord) => void;
}

export function OrdersTable({
  orders,
  onEdit,
  onDelete,
  onTrackingWhatsApp,
  onCompletionWhatsApp,
  onPrintInvoice,
}: OrdersTableProps) {
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
              <th className="px-5 py-4 text-right font-semibold">المبالغ</th>
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
                  <div className="space-y-1">
                    <p>{SERVICE_TYPE_LABELS[order.service_type]}</p>
                    {order.photographer ? (
                      <p className="text-xs text-ajn-muted">
                        {getStaffFieldLabel(order.service_type)}: {order.photographer}
                      </p>
                    ) : null}
                    {order.service_type === "Album" && order.session_type ? (
                      <p className="text-xs text-ajn-muted">نوع الجلسة: {order.session_type}</p>
                    ) : null}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={order.status} serviceType={order.service_type} />
                </td>
                <td className="px-5 py-4">
                  <OrderAmountsSummary order={order} />
                </td>
                <td className="px-5 py-4 text-sm text-ajn-muted">{formatDateOnly(order.booking_date)}</td>
                <td className="px-5 py-4 text-sm text-ajn-muted">{formatDateTime(order.updated_at)}</td>
                <td className="px-5 py-4">
                  <div className="flex max-w-[280px] flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      className="border-[#25D366]/35 bg-[#25D366]/10 px-3 py-2 text-xs text-[#b6f4cf] hover:bg-[#25D366]/16"
                      onClick={() => onTrackingWhatsApp(order)}
                      title="إرسال رابط التتبع"
                    >
                      <MessageCircleMore className="h-4 w-4" />
                      <span className="hidden 2xl:inline">رابط التتبع</span>
                    </Button>
                    {order.status === "مكتمل" ? (
                      <Button
                        variant="secondary"
                        className="border-ajn-gold/35 bg-ajn-gold/[0.12] px-3 py-2 text-xs text-ajn-goldSoft hover:bg-ajn-gold/[0.18]"
                        onClick={() => onCompletionWhatsApp(order)}
                        title="إرسال إشعار الاكتمال"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="hidden 2xl:inline">إشعار الاكتمال</span>
                      </Button>
                    ) : null}
                    <Button
                      variant="secondary"
                      className="px-3 py-2 text-xs"
                      onClick={() => onPrintInvoice(order)}
                      title="طباعة / حفظ PDF"
                    >
                      <Printer className="h-4 w-4" />
                      <span className="hidden 2xl:inline">PDF</span>
                    </Button>
                    <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => onEdit(order)}>
                      <Pencil className="h-4 w-4" />
                      <span className="hidden 2xl:inline">تعديل</span>
                    </Button>
                    <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => onDelete(order)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden 2xl:inline">حذف</span>
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
              <StatusBadge status={order.status} serviceType={order.service_type} />
            </div>
            <div className="grid gap-2 text-sm text-ajn-muted sm:grid-cols-2">
              <p>الخدمة: {SERVICE_TYPE_LABELS[order.service_type]}</p>
              {order.photographer ? (
                <p>
                  {getStaffFieldLabel(order.service_type)}: {order.photographer}
                </p>
              ) : null}
              {order.service_type === "Album" && order.session_type ? (
                <p>نوع الجلسة: {order.session_type}</p>
              ) : null}
              <p>الهاتف: {order.phone}</p>
              <p>الحجز: {formatDateOnly(order.booking_date)}</p>
              <p>
                الحالة: {getOrderStatusLabel(order.status, order.service_type)}
              </p>
              <p
                className={
                  order.photographer || (order.service_type === "Album" && order.session_type)
                    ? ""
                    : "sm:col-span-2"
                }
              >
                آخر تحديث: {formatDateTime(order.updated_at)}
              </p>
            </div>
            <div className="mt-4">
              <OrderAmountsSummary order={order} card />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="min-w-[140px] flex-1 border-[#25D366]/35 bg-[#25D366]/10 text-[#b6f4cf] hover:bg-[#25D366]/16"
                onClick={() => onTrackingWhatsApp(order)}
              >
                <MessageCircleMore className="h-4 w-4" />
                رابط التتبع
              </Button>
              {order.status === "مكتمل" ? (
                <Button
                  variant="secondary"
                  className="min-w-[140px] flex-1 border-ajn-gold/35 bg-ajn-gold/[0.12] text-ajn-goldSoft hover:bg-ajn-gold/[0.18]"
                  onClick={() => onCompletionWhatsApp(order)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  إشعار الاكتمال
                </Button>
              ) : null}
              <Button variant="secondary" className="min-w-[140px] flex-1" onClick={() => onPrintInvoice(order)}>
                <Printer className="h-4 w-4" />
                طباعة / حفظ PDF
              </Button>
              <Button variant="secondary" className="min-w-[140px] flex-1" onClick={() => onEdit(order)}>
                <Pencil className="h-4 w-4" />
                تعديل
              </Button>
              <Button variant="danger" className="min-w-[140px] flex-1" onClick={() => onDelete(order)}>
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

function OrderAmountsSummary({ order, card = false }: { order: OrderRecord; card?: boolean }) {
  return (
    <div className={card ? "rounded-2xl border border-ajn-line bg-white/[0.03] p-4" : "space-y-2 text-sm"}>
      <p className="flex items-center justify-between gap-3 text-ajn-muted">
        <span>الكلي</span>
        <span className="font-semibold text-white">{formatAmountWithCurrency(order.total_amount)}</span>
      </p>
      <p className="flex items-center justify-between gap-3 text-ajn-muted">
        <span>الواصل</span>
        <span className="font-semibold text-white">{formatAmountWithCurrency(order.received_amount)}</span>
      </p>
      <p className="flex items-center justify-between gap-3 text-ajn-muted">
        <span>المتبقي</span>
        <span className="font-semibold text-ajn-gold">{formatAmountWithCurrency(order.remaining_amount)}</span>
      </p>
    </div>
  );
}
