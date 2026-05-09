import { CalendarDays, Clock3, CreditCard, MapPinned, Package2, Phone, ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";

import { ShopOrderProgressBar, ShopOrderStatusBadge, ShopStatusTimeline } from "@/components/shop/shop-status-timeline";
import type { ShopOrderRecord } from "@/lib/shop-types";
import { getShopPaymentMethodLabel } from "@/lib/shop-utils";
import { cn, formatAmountWithCurrency, formatDateTime, maskPhone } from "@/lib/utils";

export function ShopOrderTrackingView({ order }: { order: ShopOrderRecord }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <div className="surface-panel glass-hover p-5 sm:p-7">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">{order.order_code}</h2>
            </div>
            <ShopOrderStatusBadge status={order.status} />
          </div>

          <div className="space-y-5">
            <ShopOrderProgressBar status={order.status} />

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard icon={<Phone className="h-4 w-4" />} label="الاسم" value={order.customer_name} />
              <InfoCard icon={<Phone className="h-4 w-4" />} label="الهاتف" value={maskPhone(order.phone)} />
              <InfoCard icon={<CreditCard className="h-4 w-4" />} label="الدفع" value={getShopPaymentMethodLabel(order.payment_method)} />
              <InfoCard icon={<Clock3 className="h-4 w-4" />} label="الطلب" value={formatDateTime(order.created_at)} />
              <InfoCard icon={<MapPinned className="h-4 w-4" />} label="المدينة" value={order.city} />
              <InfoCard icon={<CalendarDays className="h-4 w-4" />} label="الإجمالي" value={formatAmountWithCurrency(order.total)} />
            </div>

            <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="mb-2 text-sm text-ajn-goldSoft">العنوان</p>
              <p className="leading-8 text-ajn-ivory">{order.address}</p>
            </div>

            {order.driver_notes ? (
              <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="mb-2 text-sm text-ajn-goldSoft">تعليمات السائق</p>
                <p className="leading-8 text-ajn-ivory">{order.driver_notes}</p>
              </div>
            ) : null}

            <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="mb-4 text-sm text-ajn-goldSoft">المنتجات</p>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/6 bg-black/20 p-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.04] text-ajn-gold">
                      <Package2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{item.product_name}</p>
                      <p className="text-sm text-ajn-muted">x{item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-ajn-gold">{formatAmountWithCurrency(item.total)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="mb-4 text-sm text-ajn-goldSoft">الملخص</p>
              <div className="space-y-3 text-sm">
                <SummaryLine label="المجموع" value={formatAmountWithCurrency(order.subtotal)} />
                <SummaryLine label="التوصيل" value={formatAmountWithCurrency(order.delivery_fee)} />
                <SummaryLine label="التغليف" value={formatAmountWithCurrency(order.wrapping_price)} />
                <SummaryLine label="الإجمالي" value={formatAmountWithCurrency(order.total)} strong />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ShopStatusTimeline status={order.status} />
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-white/6 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]", className)}>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-ajn-goldSoft">
        <span className="shrink-0 text-ajn-gold">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="text-sm font-semibold leading-7 text-white">{value}</p>
    </div>
  );
}

function SummaryLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? "font-semibold text-white" : "text-ajn-muted"}>{label}</span>
      <span className={strong ? "text-lg font-bold text-ajn-gold" : "font-semibold text-white"}>{value}</span>
    </div>
  );
}
