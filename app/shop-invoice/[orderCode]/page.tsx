import { notFound } from "next/navigation";

import { ShopInvoiceActions } from "@/components/shop/shop-invoice-actions";
import { getAdminSession } from "@/lib/auth";
import { getShopOrderByCode } from "@/lib/server/shop";
import { getCustomizationSummaryEntries, getShopPaymentMethodLabel } from "@/lib/shop-utils";
import { formatAmountWithCurrency, formatDateTime } from "@/lib/utils";

interface PageProps {
  params: Promise<{ orderCode: string }>;
}

export const dynamic = "force-dynamic";

export default async function ShopInvoicePage({ params }: PageProps) {
  const session = await getAdminSession();

  if (!session) {
    notFound();
  }

  const { orderCode } = await params;
  const order = await getShopOrderByCode(decodeURIComponent(orderCode));

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6 text-black print:min-h-0 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-4xl">
        <ShopInvoiceActions />

        <section className="overflow-hidden rounded-[26px] border border-black/10 bg-white p-5 shadow-[0_18px_60px_rgba(0,0,0,0.08)] print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <div className="mb-6 border-b border-black/10 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.26em] text-[#9b7b25]">AJN EVENTS GROUP</p>
                <h1 className="mt-2 text-2xl font-bold text-black">مجموعة علي جان نهاد لتنظيم المناسبات</h1>
              </div>

              <div className="rounded-[22px] border border-[#d4af37]/35 bg-[#f8f2df] px-5 py-3 text-right">
                <p className="text-xs font-semibold text-[#9b7b25]">رقم التتبع</p>
                <p className="mt-1 text-lg font-bold text-black">{order.order_code}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <InvoiceCell label="اسم الزبون" value={order.customer_name} />
            <InvoiceCell label="رقم الهاتف" value={order.phone} />
            <InvoiceCell label="التاريخ" value={formatDateTime(order.created_at)} />
            <InvoiceCell label="المحافظة" value={order.province || order.city} />
            <InvoiceCell label="المنطقة" value={order.district || "—"} />
            <InvoiceCell label="العنوان" value={`${order.address}`} className="sm:col-span-2 lg:col-span-2" />
            <InvoiceCell label="نوع التوصيل" value={order.delivery_type || "توصيل"} />
            <InvoiceCell label="الوقت المتوقع" value={order.delivery_eta || "—"} />
            <InvoiceCell label="طريقة الدفع" value={getShopPaymentMethodLabel(order.payment_method)} />
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-black/10">
            <table className="w-full text-right text-sm">
              <thead className="bg-black/[0.03]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-black">المنتج</th>
                  <th className="px-4 py-3 font-semibold text-black">الكمية</th>
                  <th className="px-4 py-3 font-semibold text-black">السعر</th>
                  <th className="px-4 py-3 font-semibold text-black">المجموع</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-t border-black/10">
                    <td className="px-4 py-3 font-medium text-black">
                      <div className="space-y-1">
                        <p>{item.product_name}</p>
                        {item.selected_color_name || item.selected_color_hex ? (
                          <p className="text-xs font-medium text-black/70">
                            اللون: {item.selected_color_name || item.selected_color_hex}
                          </p>
                        ) : null}
                        {getCustomizationSummaryEntries(item.customization).map((entry) => (
                          <p key={`${item.id}-${entry.label}`} className="text-xs font-medium text-black/70">
                            {entry.label}: {entry.value}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-black">{item.quantity}</td>
                    <td className="px-4 py-3 text-black">{formatAmountWithCurrency(item.price)}</td>
                    <td className="px-4 py-3 font-semibold text-black">{formatAmountWithCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InvoiceCell label="المجموع" value={formatAmountWithCurrency(order.subtotal)} />
            <InvoiceCell label="التوصيل" value={formatAmountWithCurrency(order.delivery_fee)} />
            <InvoiceCell label="التغليف" value={formatAmountWithCurrency(order.wrapping_price)} />
            <InvoiceCell label="المجموع النهائي" value={formatAmountWithCurrency(order.total)} accent />
          </div>
        </section>
      </div>
    </div>
  );
}

function InvoiceCell({
  label,
  value,
  className = "",
  accent = false,
}: {
  label: string;
  value: string;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[20px] border px-4 py-3 ${className} ${
        accent ? "border-[#d4af37]/35 bg-[#f8f2df]" : "border-black/10 bg-white"
      }`}
    >
      <p className="mb-1 text-xs font-semibold text-[#9b7b25]">{label}</p>
      <p className="text-sm font-semibold leading-7 text-black">{value}</p>
    </div>
  );
}
