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
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-black print:min-h-0 print:bg-white print:px-0 print:py-0">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 6mm;
        }

        @media print {
          html, body {
            width: 210mm;
            min-height: 297mm;
            overflow: hidden;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[190mm]">
        <InvoicePrintActions orderId={order.id} orderCode={order.order_code} autoPrint={autoPrint} />

        <article
          id="invoice-document"
          className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] print:max-w-none print:rounded-none print:border-none print:shadow-none"
        >
          <div className="flex flex-col gap-4 p-4 print:gap-[3.5mm] print:p-0">
            {[1, 2, 3].map((copyIndex) => (
              <InvoiceCopy
                key={copyIndex}
                orderCode={order.order_code}
                customerName={order.name}
                phone={order.phone}
                serviceType={SERVICE_TYPE_LABELS[order.service_type]}
                bookingDate={formatDateOnly(order.booking_date)}
                status={order.status}
                updatedAt={formatDateTime(order.updated_at)}
                totalAmount={formatAmountWithCurrency(order.total_amount)}
                receivedAmount={formatAmountWithCurrency(order.received_amount)}
                remainingAmount={formatAmountWithCurrency(order.remaining_amount)}
                notes={order.notes}
                invoiceIssuedAt={formatDateTime(invoiceIssuedAt)}
                showDivider={copyIndex < 3}
              />
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

function InvoiceCopy({
  orderCode,
  customerName,
  phone,
  serviceType,
  bookingDate,
  status,
  updatedAt,
  totalAmount,
  receivedAmount,
  remainingAmount,
  notes,
  invoiceIssuedAt,
  showDivider,
}: {
  orderCode: string;
  customerName: string;
  phone: string;
  serviceType: string;
  bookingDate: string;
  status: string;
  updatedAt: string;
  totalAmount: string;
  receivedAmount: string;
  remainingAmount: string;
  notes: string;
  invoiceIssuedAt: string;
  showDivider: boolean;
}) {
  return (
    <section className="rounded-[22px] border border-black/10 bg-white p-4 print:rounded-[12px] print:border-black/15 print:p-[3.2mm]">
      <div className="mb-3 flex items-start justify-between gap-4 border-b border-black/10 pb-3 print:mb-[2.4mm] print:gap-[2mm] print:pb-[2mm]">
        <div>
          <p className="mb-1 text-[11px] font-semibold tracking-[0.22em] text-[#8a6a10] print:text-[7.5px]">
            AJN EVENTS GROUP
          </p>
          <h1 className="text-lg font-bold text-black print:text-[12px]">
            مجموعة علي جان نهاد لتنظيم المناسبات
          </h1>
          <p className="mt-1 text-[11px] text-black/60 print:mt-[1mm] print:text-[7px]">
            فاتورة طلب جاهزة للطباعة والحفظ
          </p>
        </div>

        <div className="min-w-[92px] rounded-[16px] border border-black/10 bg-[#faf7eb] px-3 py-2 text-right print:min-w-[28mm] print:rounded-[8px] print:px-[2mm] print:py-[1.2mm]">
          <p className="text-[10px] text-[#8a6a10] print:text-[6.8px]">رقم الفاتورة</p>
          <p className="mt-1 text-sm font-bold text-black print:mt-[0.8mm] print:text-[10px]">{orderCode}</p>
          <p className="mt-1 text-[10px] text-black/60 print:text-[6.6px]">الإصدار: {invoiceIssuedAt}</p>
        </div>
      </div>

      <div className="grid gap-2 print:gap-[1.6mm]">
        <div className="grid gap-2 sm:grid-cols-3 print:grid-cols-3 print:gap-[1.6mm]">
          <InvoiceCell label="اسم الزبون" value={customerName} />
          <InvoiceCell label="رقم الهاتف" value={phone} />
          <InvoiceCell label="نوع الخدمة" value={serviceType} />
          <InvoiceCell label="تاريخ الحجز" value={bookingDate} />
          <InvoiceCell label="الحالة الحالية" value={status} />
          <InvoiceCell label="آخر تحديث" value={updatedAt} />
        </div>

        <div className="grid gap-2 sm:grid-cols-3 print:grid-cols-3 print:gap-[1.6mm]">
          <InvoiceAmountCell label="المبلغ الكلي" value={totalAmount} />
          <InvoiceAmountCell label="المبلغ الواصل" value={receivedAmount} />
          <InvoiceAmountCell label="المبلغ المتبقي" value={remainingAmount} accent />
        </div>

        <div className="rounded-[16px] border border-black/10 bg-[#fcfcfc] px-3 py-2 print:rounded-[8px] print:px-[2mm] print:py-[1.4mm]">
          <p className="mb-1 text-[10px] font-semibold text-[#8a6a10] print:mb-[0.8mm] print:text-[6.8px]">الملاحظات</p>
          <p className="whitespace-pre-wrap text-[11px] leading-6 text-black/75 print:text-[7px] print:leading-[1.45]">
            {notes || "لا توجد ملاحظات مضافة على هذا الطلب."}
          </p>
        </div>
      </div>

      {showDivider ? (
        <div className="mt-3 border-t border-dashed border-black/15 pt-1 print:mt-[2.4mm] print:pt-[0.2mm]" />
      ) : null}
    </section>
  );
}

function InvoiceCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-black/10 bg-[#fcfcfc] px-3 py-2 print:rounded-[8px] print:px-[2mm] print:py-[1.2mm]">
      <p className="mb-1 text-[10px] text-[#8a6a10] print:mb-[0.8mm] print:text-[6.8px]">{label}</p>
      <p className="text-[12px] font-semibold text-black print:text-[7.4px]">{value}</p>
    </div>
  );
}

function InvoiceAmountCell({
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
        "rounded-[16px] border px-3 py-2 print:rounded-[8px] print:px-[2mm] print:py-[1.2mm]",
        accent ? "border-[#d4af37]/35 bg-[#faf7eb]" : "border-black/10 bg-[#fcfcfc]",
      ].join(" ")}
    >
      <p className="mb-1 text-[10px] text-[#8a6a10] print:mb-[0.8mm] print:text-[6.8px]">{label}</p>
      <p className="text-[12px] font-bold text-black print:text-[7.4px]">{value}</p>
    </div>
  );
}