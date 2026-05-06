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
    <div className="min-h-screen bg-[#0a0a0a] px-3 py-5 text-black sm:px-4 sm:py-8 print:min-h-0 print:bg-white print:px-0 print:py-0">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm 9mm 12mm;
        }

        @media print {
          html, body {
            width: 210mm;
            min-height: 297mm;
            overflow: visible;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[920px] print:mx-0 print:max-w-[188mm]">
        <InvoicePrintActions orderId={order.id} orderCode={order.order_code} autoPrint={autoPrint} />

        <article
          id="invoice-document"
          className="overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] print:w-full print:max-w-[188mm] print:break-inside-avoid-page print:rounded-[16px] print:border-black/15 print:shadow-none"
        >
          <InvoiceCopy
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
          />
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
}) {
  return (
    <section className="bg-white p-4 sm:p-5 print:p-[4.2mm]">
      <div className="mb-4 flex flex-col gap-4 border-b border-black/10 pb-4 sm:flex-row sm:items-start sm:justify-between print:mb-[3mm] print:gap-[3mm] print:pb-[2.6mm]">
        <div>
          <p className="mb-1 text-[11px] font-semibold tracking-[0.22em] text-[#8a6a10] print:text-[8.4px]">
            AJN EVENTS GROUP
          </p>
          <h1 className="text-xl font-extrabold text-black sm:text-[1.4rem] print:text-[13.5px]">
            مجموعة علي جان نهاد لتنظيم المناسبات
          </h1>
        </div>

        <div className="w-full rounded-[18px] border border-black/10 bg-[#faf7eb] px-4 py-3 text-right sm:max-w-[180px] print:max-w-[42mm] print:rounded-[10px] print:px-[2.4mm] print:py-[1.8mm]">
          <p className="text-[11px] font-semibold text-[#8a6a10] print:text-[8px]">رقم الفاتورة</p>
          <p className="mt-1 text-base font-extrabold text-black print:text-[11px]">{orderCode}</p>
          <p className="mt-1 text-[11px] font-medium text-black/70 print:text-[7.8px]">
            الإصدار: {invoiceIssuedAt}
          </p>
        </div>
      </div>

      <div className="grid gap-3 print:gap-[2mm]">
        <div className="grid gap-3 sm:grid-cols-3 print:grid-cols-3 print:gap-[2mm]">
          <InvoiceCell label="اسم الزبون" value={customerName} />
          <InvoiceCell label="رقم الهاتف" value={phone} />
          <InvoiceCell label="نوع الخدمة" value={serviceType} />
          <InvoiceCell label="تاريخ الحجز" value={bookingDate} />
          <InvoiceCell label="الحالة الحالية" value={status} />
          <InvoiceCell label="آخر تحديث" value={updatedAt} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3 print:grid-cols-3 print:gap-[2mm]">
          <InvoiceAmountCell label="المبلغ الكلي" value={totalAmount} />
          <InvoiceAmountCell label="المبلغ الواصل" value={receivedAmount} />
          <InvoiceAmountCell label="المبلغ المتبقي" value={remainingAmount} accent />
        </div>

        <div className="rounded-[18px] border border-black/10 bg-[#fcfcfc] px-4 py-3 print:rounded-[10px] print:px-[2.4mm] print:py-[2mm]">
          <p className="mb-1 text-[11px] font-bold text-[#8a6a10] print:text-[8px]">الملاحظات</p>
          <p className="whitespace-pre-wrap text-[13px] leading-6 font-medium text-black/85 print:text-[8.8px] print:leading-[1.6]">
            {notes || "لا توجد ملاحظات مضافة على هذا الطلب."}
          </p>
        </div>
      </div>
    </section>
  );
}

function InvoiceCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-black/10 bg-[#fcfcfc] px-4 py-3 print:rounded-[10px] print:px-[2.4mm] print:py-[1.8mm]">
      <p className="mb-1 text-[11px] font-bold text-[#8a6a10] print:text-[8px]">{label}</p>
      <p className="text-[13px] font-extrabold text-black print:text-[9.4px]">{value}</p>
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
        "rounded-[18px] border px-4 py-4 print:rounded-[10px] print:px-[2.4mm] print:py-[2.2mm]",
        accent ? "border-[#d4af37]/45 bg-[#faf7eb]" : "border-black/10 bg-[#fcfcfc]",
      ].join(" ")}
    >
      <p className="mb-1 text-[11px] font-bold text-[#8a6a10] print:text-[8px]">{label}</p>
      <p className="text-[13px] font-extrabold text-black print:text-[9.6px]">{value}</p>
    </div>
  );
}
