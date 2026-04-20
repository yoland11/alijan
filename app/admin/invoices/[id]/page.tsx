import { notFound, redirect } from "next/navigation";

import { InvoicePrintActions } from "@/components/admin/invoice-print-actions";
import { getAdminSession } from "@/lib/auth";
import { SERVICE_TYPE_LABELS } from "@/lib/constants";
import { getOrderById } from "@/lib/server/orders";
import { formatAmountWithCurrency, formatDateOnly, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface InvoicePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}

export default async function InvoicePage({ params, searchParams }: InvoicePageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const { print } = await searchParams;
  const autoPrint = print === "1";
  const order = await getOrderById(id).catch(() => null);
  const invoiceIssuedAt = new Date().toISOString();

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#040404] px-4 py-8 text-white print:min-h-0 print:bg-white print:px-0 print:py-0 print:text-black">
      <style>{`
        @page {
          size: A4;
          margin: 7mm;
        }

        @media print {
          html, body {
            width: 210mm;
            height: 297mm;
            overflow: hidden;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="invoice-sheet mx-auto w-full max-w-[198mm] print:max-w-[196mm]">
        <InvoicePrintActions orderId={order.id} autoPrint={autoPrint} />

        <article className="overflow-hidden rounded-[34px] border border-ajn-line bg-[#060606] shadow-[0_32px_100px_rgba(0,0,0,0.35)] print:rounded-none print:border-none print:bg-white print:shadow-none">
          <header className="border-b border-ajn-line bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.18),_transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] px-8 py-8 print:px-5 print:py-4 print:bg-none">
            <div className="flex flex-wrap items-start justify-between gap-6 print:gap-4">
              <div>
                <p className="mb-3 text-sm font-semibold tracking-[0.22em] text-ajn-goldSoft print:mb-2 print:text-[10px] print:text-[#8a6a10]">
                  AJN EVENTS GROUP
                </p>
                <h1 className="text-3xl font-bold text-white print:text-2xl print:text-black">
                  مجموعة علي جان نهاد لتنظيم المناسبات
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-ajn-muted print:mt-2 print:max-w-[110mm] print:text-xs print:leading-5 print:text-neutral-600">
                </p>
              </div>

              <div className="rounded-[28px] border border-ajn-line bg-black/20 px-5 py-4 text-right print:rounded-[18px] print:border-neutral-300 print:bg-neutral-50 print:px-4 print:py-3">
                <p className="mb-2 text-sm text-ajn-goldSoft print:mb-1 print:text-[10px] print:text-[#8a6a10]">الفاتورة</p>
                <p className="text-xl font-bold text-white print:text-lg print:text-black">{order.order_code}</p>
                <p className="mt-2 text-sm text-ajn-muted print:mt-1 print:text-[11px] print:text-neutral-600">
                  تاريخ الإصدار: {formatDateTime(invoiceIssuedAt)}
                </p>
              </div>
            </div>
          </header>

          <div className="space-y-8 px-8 py-8 print:space-y-4 print:px-5 print:py-4">
            <section className="grid gap-4 md:grid-cols-2 print:grid-cols-3 print:gap-2">
              <InvoiceInfoCard label="اسم الزبون" value={order.name} />
              <InvoiceInfoCard label="رقم الهاتف" value={order.phone} />
              <InvoiceInfoCard label="نوع الخدمة" value={SERVICE_TYPE_LABELS[order.service_type]} />
              <InvoiceInfoCard label="تاريخ الحجز" value={formatDateOnly(order.booking_date)} />
              <InvoiceInfoCard label="الحالة الحالية" value={order.status} />
              <InvoiceInfoCard label="آخر تحديث" value={formatDateTime(order.updated_at)} />
            </section>

            <section className="rounded-[30px] border border-ajn-line bg-white/[0.03] p-6 print:rounded-[20px] print:border-neutral-300 print:bg-neutral-50 print:p-4">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:mb-3">
                <div>
                  <p className="mb-2 text-sm text-ajn-goldSoft print:mb-1 print:text-[10px] print:text-[#8a6a10]">البيانات المالية</p>
                  <h2 className="text-2xl font-bold text-white print:text-xl print:text-black">ملخص المبالغ</h2>
                </div>
                <span className="rounded-full border border-ajn-line px-3 py-1 text-xs text-ajn-muted print:border-neutral-300 print:px-2 print:py-1 print:text-[10px] print:text-neutral-600">
                  alijan
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-3 print:gap-2">
                <InvoiceAmountCard label="المبلغ الكلي" value={formatAmountWithCurrency(order.total_amount)} />
                <InvoiceAmountCard label="المبلغ الواصل" value={formatAmountWithCurrency(order.received_amount)} />
                <InvoiceAmountCard label="المبلغ المتبقي" value={formatAmountWithCurrency(order.remaining_amount)} accent />
              </div>
            </section>

            <section className="rounded-[30px] border border-ajn-line bg-white/[0.03] p-6 print:rounded-[20px] print:border-neutral-300 print:bg-neutral-50 print:p-4">
              <p className="mb-3 text-sm text-ajn-goldSoft print:mb-2 print:text-[10px] print:text-[#8a6a10]">الملاحظات</p>
              <p className="whitespace-pre-wrap leading-8 text-ajn-ivory print:text-sm print:leading-6 print:text-neutral-800">
                {order.notes || "لا توجد ملاحظات مضافة على هذا الطلب."}
              </p>
            </section>

            <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-ajn-line pt-6 text-sm text-ajn-muted print:gap-2 print:border-neutral-300 print:pt-4 print:text-[11px] print:text-neutral-600">
              <p>رقم الطلب: {order.order_code}</p>
            </footer>
          </div>
        </article>
      </div>
    </div>
  );
}

function InvoiceInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[26px] border border-ajn-line bg-white/[0.03] p-5 print:rounded-[16px] print:border-neutral-300 print:bg-white print:p-3">
      <p className="mb-2 text-sm text-ajn-goldSoft print:mb-1 print:text-[10px] print:text-[#8a6a10]">{label}</p>
      <p className="text-base font-semibold text-white print:text-sm print:text-black">{value}</p>
    </div>
  );
}

function InvoiceAmountCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[26px] border p-5 print:rounded-[16px] print:bg-white print:p-3",
        accent
          ? "border-ajn-gold/30 bg-ajn-gold/[0.08] print:border-[#c8a132]"
          : "border-ajn-line bg-black/20 print:border-neutral-300",
      ].join(" ")}
    >
      <p className="mb-2 text-sm text-ajn-goldSoft print:mb-1 print:text-[10px] print:text-[#8a6a10]">{label}</p>
      <p className="text-2xl font-bold text-white print:text-lg print:text-black">{value}</p>
    </div>
  );
}
