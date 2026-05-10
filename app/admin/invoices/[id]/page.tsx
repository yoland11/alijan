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
  const issuedAt = new Date();

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#090909] px-3 py-5 text-black print:min-h-0 print:bg-white print:px-0 print:py-0">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media print {
          html,
          body {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            overflow: visible;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            background: #ffffff !important;
            overflow: visible !important;
          }

          .invoice-card {
            width: 202mm !important;
            max-width: none !important;
            min-width: 202mm !important;
            margin-top: 4mm !important;
            margin-bottom: 0 !important;
            margin-left: auto !important;
            margin-right: auto !important;
            overflow: visible !important;
            position: static !important;
            transform: none !important;
            box-shadow: none !important;
            break-inside: avoid-page;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="print-page mx-auto w-full max-w-[1200px] print:max-w-none">
        <InvoicePrintActions orderId={order.id} orderCode={order.order_code} autoPrint={autoPrint} />

        <article
          id="invoice-document"
          className="invoice-card mx-auto overflow-hidden rounded-[26px] border border-black/15 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] print:rounded-none print:border print:border-black/20"
        >
          <InvoiceSheet
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
            issuedDate={formatDateOnly(issuedAt.toISOString())}
            issuedTime={formatTimeOnly(issuedAt)}
          />
        </article>
      </div>
    </div>
  );
}

function InvoiceSheet({
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
  issuedDate,
  issuedTime,
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
  issuedDate: string;
  issuedTime: string;
}) {
  return (
    <section className="h-full w-full bg-white p-[5mm] print:h-auto print:p-[5mm]">
      <div className="grid h-full grid-rows-[auto_auto_1fr] gap-[3mm] border border-black px-[4mm] py-[4mm] print:h-auto">
        <header className="grid grid-cols-[52mm_1fr] gap-[4mm] border-b border-black pb-[3mm]">
          <div className="flex flex-col items-start justify-between">
            <div className="flex h-[31mm] w-[31mm] items-center justify-center rounded-full border-[3px] border-[#6f6f6f] bg-[radial-gradient(circle_at_72%_74%,#d3a330_0_26%,transparent_27%),linear-gradient(135deg,#595959_0%,#2d2d2d_65%,#0f0f0f_100%)] text-[15px] font-black tracking-[0.16em] text-white">
              AJN
            </div>
            <div className="mt-[2mm] text-right">
              <p className="text-[15px] font-extrabold leading-tight text-black">علي جان نهاد</p>
              <p className="text-[9px] font-semibold tracking-[0.24em] text-black/75">ALI JAN NIHAD</p>
            </div>
          </div>

          <div className="flex flex-col justify-between text-right">
            <div>
              <h1 className="text-[20px] font-black leading-tight text-black">مجموعة علي جان نهاد</h1>
              <p className="mt-[1.4mm] text-[11px] font-semibold text-black/80">{serviceType}</p>
            </div>

            <div className="space-y-[1mm] text-[11px] font-bold leading-snug text-black">
              <p>حالة الطلب: {status}</p>
              <p>آخر تحديث: {updatedAt}</p>
              <p>{phone}</p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-3 gap-[3mm] border-b border-black pb-[3mm] text-[11px] font-bold text-black">
          <HeaderInfo label="التاريخ" value={issuedDate} />
          <HeaderInfo label="رقم الفاتورة" value={orderCode} align="center" />
          <HeaderInfo label="الوقت" value={issuedTime} align="left" />
        </section>

        <section className="grid min-h-0 grid-rows-[auto_1fr] rounded-[5mm] border border-black">
          <div className="border-b border-black py-[2mm] text-center text-[12px] font-black text-black">
            تفاصيل الحجز
          </div>

          <div className="grid min-h-0 grid-cols-[44mm_1fr]">
            <div className="border-l border-black">
              <AmountBlock label="المبلغ الكلي" value={totalAmount} dark />
              <AmountBlock label="المبلغ الواصل" value={receivedAmount} />
              <AmountBlock label="المبلغ الباقي" value={remainingAmount} dark />
            </div>

            <div className="grid min-h-0 grid-rows-[repeat(6,1fr)_auto]">
              <DetailRow label="اسم العميل" value={customerName} />
              <DetailRow label="الهاتف" value={phone} />
              <DetailRow label="العنوان" value="-" />
              <DetailRow label="القسم" value={serviceType} />
              <DetailRow label="تاريخ الحجز" value={bookingDate} />
              <DetailRow label="آخر تحديث" value={updatedAt} />
              <StatementRow label="البيان" value={notes || "لا توجد ملاحظات"} />
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function HeaderInfo({
  label,
  value,
  align = "right",
}: {
  label: string;
  value: string;
  align?: "right" | "center" | "left";
}) {
  const alignmentClass =
    align === "center" ? "text-center" : align === "left" ? "text-left" : "text-right";

  return (
    <div className={`grid gap-[1mm] ${alignmentClass}`}>
      <span className="text-[10px] font-bold text-black/75">{label}</span>
      <strong className="text-[12px] font-black text-black">{value}</strong>
    </div>
  );
}

function AmountBlock({
  label,
  value,
  dark = false,
}: {
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_24mm] border-b border-black last:border-b-0">
      <div className="flex items-center justify-end px-[2.6mm] py-[3.3mm] text-right text-[11px] font-black text-black">
        {label} :
      </div>
      <div
        className={[
          "flex items-center justify-center px-[2mm] py-[3.3mm] text-[11px] font-black",
          dark ? "bg-[#515151] text-white" : "bg-white text-black",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[30mm_1fr] border-b border-black last:border-b-0">
      <div className="flex items-center justify-end bg-[#ececec] px-[2.4mm] py-[2.4mm] text-right text-[11px] font-black text-black">
        {label}:
      </div>
      <div className="flex items-center justify-end px-[2.8mm] py-[2.4mm] text-right text-[11px] font-black text-black">
        {value}
      </div>
    </div>
  );
}

function StatementRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[30mm_1fr]">
      <div className="flex items-center justify-end bg-[#ececec] px-[2.4mm] py-[2.4mm] text-right text-[11px] font-black text-black">
        {label}:
      </div>
      <div className="flex items-center justify-end px-[2.8mm] py-[2.4mm] text-right text-[11px] font-black leading-[1.55] text-black">
        {value}
      </div>
    </div>
  );
}

function formatTimeOnly(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
