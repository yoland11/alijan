import Image from "next/image";
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
        .invoice-page,
        .invoice-page *,
        .invoice-card,
        .invoice-card * {
          box-sizing: border-box;
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }

        .invoice-page {
          margin: 0 auto;
        }

        .invoice-card {
          width: 202mm;
          min-width: 202mm;
          max-width: 202mm;
          height: 130mm;
          min-height: 130mm;
          max-height: 130mm;
          margin: 0 auto;
          overflow: hidden;
          background: #ffffff;
        }

        .invoice-shell {
          width: 100%;
          height: 100%;
          padding: 4mm;
          background: #ffffff;
        }

        .invoice-frame {
          display: flex;
          height: 100%;
          width: 100%;
          flex-direction: column;
          gap: 2.4mm;
          overflow: hidden;
          border: 1px solid #000;
          padding: 3.2mm;
          background: #ffffff;
        }

        .invoice-header {
          display: grid;
          grid-template-columns: 45mm minmax(0, 1fr);
          gap: 3mm;
          min-width: 0;
          border-bottom: 1px solid #000;
          padding-bottom: 2.5mm;
        }

        .invoice-logo-column,
        .invoice-title-column {
          min-width: 0;
        }

        .invoice-logo-column {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: space-between;
        }

        .invoice-logo-wrap {
          display: flex;
          height: 28mm;
          width: 28mm;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #ffffff;
        }

        .invoice-logo-image {
          height: 100%;
          width: 100%;
          object-fit: contain;
        }

        .invoice-brand {
          margin-top: 1.2mm;
          text-align: right;
        }

        .invoice-brand-ar {
          font-size: 12px;
          font-weight: 900;
          line-height: 1.1;
          color: #000;
        }

        .invoice-brand-en {
          margin-top: 0.6mm;
          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: rgba(0, 0, 0, 0.74);
        }

        .invoice-title-column {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: right;
        }

        .invoice-heading {
          font-size: 18px;
          font-weight: 900;
          line-height: 1.12;
          color: #000;
        }

        .invoice-service {
          margin-top: 0.9mm;
          font-size: 10px;
          font-weight: 700;
          color: rgba(0, 0, 0, 0.8);
        }

        .invoice-summary {
          display: grid;
          gap: 0.55mm;
          font-size: 10px;
          font-weight: 800;
          line-height: 1.25;
          color: #000;
        }

        .invoice-meta {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 2mm;
          min-width: 0;
          border-bottom: 1px solid #000;
          padding-bottom: 2.3mm;
        }

        .invoice-meta-item {
          min-width: 0;
        }

        .invoice-meta-item.center {
          text-align: center;
        }

        .invoice-meta-item.left {
          text-align: left;
        }

        .invoice-meta-item.right {
          text-align: right;
        }

        .invoice-meta-label {
          display: block;
          margin-bottom: 0.55mm;
          font-size: 9px;
          font-weight: 700;
          color: rgba(0, 0, 0, 0.72);
        }

        .invoice-meta-value {
          display: block;
          font-size: 11px;
          font-weight: 900;
          color: #000;
        }

        .invoice-detail-box {
          display: flex;
          min-height: 0;
          flex: 1;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #000;
          border-radius: 2mm;
          background: #fff;
        }

        .invoice-detail-title {
          border-bottom: 1px solid #000;
          padding: 1.8mm 0;
          text-align: center;
          font-size: 11px;
          font-weight: 900;
          color: #000;
        }

        .invoice-detail-body {
          display: grid;
          min-height: 0;
          flex: 1;
          grid-template-columns: 42mm minmax(0, 1fr);
          overflow: hidden;
        }

        .invoice-amount-panel {
          min-width: 0;
          border-left: 1px solid #000;
        }

        .invoice-amount-table,
        .invoice-detail-table {
          width: 100%;
          height: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .invoice-amount-table td,
        .invoice-detail-table td {
          overflow: hidden;
          border-bottom: 1px solid #000;
          padding: 1.6mm 2.2mm;
          font-size: 10px;
          font-weight: 800;
          line-height: 1.2;
          color: #000;
          vertical-align: middle;
          word-break: break-word;
        }

        .invoice-amount-table tr:last-child td,
        .invoice-detail-table tr:last-child td {
          border-bottom: 0;
        }

        .invoice-amount-label {
          text-align: right;
        }

        .invoice-amount-value {
          width: 24mm;
          text-align: center;
        }

        .invoice-amount-value.is-dark {
          background: #515151;
          color: #fff;
        }

        .invoice-detail-label {
          width: 30mm;
          background: #ececec;
          text-align: right;
        }

        .invoice-detail-value {
          text-align: right;
        }

        .invoice-statement-value {
          vertical-align: top;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }

        @media print {
          html,
          body {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            overflow: hidden;
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .invoice-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #ffffff !important;
            transform: none !important;
            zoom: 1 !important;
            box-shadow: none !important;
            filter: none !important;
          }

          .invoice-card {
            width: 202mm !important;
            max-width: none !important;
            min-width: 202mm !important;
            height: 130mm !important;
            min-height: 130mm !important;
            max-height: 130mm !important;
            margin-top: 4mm !important;
            margin-bottom: 0 !important;
            margin-left: auto !important;
            margin-right: auto !important;
            overflow: hidden !important;
            position: static !important;
            transform: none !important;
            zoom: 1 !important;
            box-shadow: none !important;
            filter: none !important;
            border: 1px solid #000 !important;
            border-radius: 0 !important;
            break-inside: avoid-page;
            page-break-inside: avoid;
          }

          .invoice-shell,
          .invoice-frame,
          .invoice-header,
          .invoice-meta,
          .invoice-detail-box,
          .invoice-detail-body,
          .invoice-amount-panel,
          .invoice-logo-wrap,
          .invoice-amount-table,
          .invoice-detail-table,
          .invoice-amount-table tr,
          .invoice-detail-table tr,
          .invoice-amount-table td,
          .invoice-detail-table td {
            box-shadow: none !important;
            filter: none !important;
            transform: none !important;
          }

          .invoice-frame {
            gap: 2.1mm !important;
            overflow: hidden !important;
            border: 1px solid #000 !important;
          }

          .invoice-detail-box {
            border: 1px solid #000 !important;
            border-radius: 2mm !important;
          }

          .invoice-amount-table,
          .invoice-detail-table {
            border-collapse: collapse !important;
            table-layout: fixed !important;
          }

          .invoice-amount-table td,
          .invoice-detail-table td {
            border-bottom: 1px solid #000 !important;
          }
        }
      `}</style>

      <div className="invoice-page mx-auto w-full max-w-[1200px] print:max-w-none">
        <InvoicePrintActions orderId={order.id} orderCode={order.order_code} autoPrint={autoPrint} />

        <article
          id="invoice-document"
          className="invoice-card mx-auto overflow-hidden rounded-[14px] border border-black/15 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] print:rounded-none"
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
  const detailRows = [
    { label: "اسم العميل", value: customerName },
    { label: "الهاتف", value: phone },
    { label: "العنوان", value: "-" },
    { label: "القسم", value: serviceType },
    { label: "تاريخ الحجز", value: bookingDate },
    { label: "آخر تحديث", value: updatedAt },
    { label: "البيان", value: notes || "لا توجد ملاحظات", statement: true },
  ];

  const amountRows = [
    { label: "المبلغ الكلي", value: totalAmount, dark: true },
    { label: "المبلغ الواصل", value: receivedAmount, dark: false },
    { label: "المبلغ الباقي", value: remainingAmount, dark: true },
  ];

  return (
    <section className="invoice-shell">
      <div className="invoice-frame">
        <header className="invoice-header">
          <div className="invoice-logo-column">
            <div className="invoice-logo-wrap">
              <Image
                src="/invoice-logo.png"
                alt="شعار علي جان نهاد"
                width={120}
                height={120}
                priority
                unoptimized
                className="invoice-logo-image"
              />
            </div>
            <div className="invoice-brand">
              <p className="invoice-brand-ar">علي جان نهاد</p>
              <p className="invoice-brand-en">ALI JAN NIHAD</p>
            </div>
          </div>

          <div className="invoice-title-column">
            <div>
              <h1 className="invoice-heading">مجموعة علي جان نهاد</h1>
              <p className="invoice-service">{serviceType}</p>
            </div>

            <div className="invoice-summary">
              <p>حالة الطلب: {status}</p>
              <p>آخر تحديث: {updatedAt}</p>
              <p>{phone}</p>
            </div>
          </div>
        </header>

        <section className="invoice-meta">
          <InvoiceMetaItem label="التاريخ" value={issuedDate} align="right" />
          <InvoiceMetaItem label="رقم الفاتورة" value={orderCode} align="center" />
          <InvoiceMetaItem label="الوقت" value={issuedTime} align="left" />
        </section>

        <section className="invoice-detail-box">
          <div className="invoice-detail-title">تفاصيل الحجز</div>

          <div className="invoice-detail-body">
            <div className="invoice-amount-panel">
              <table className="invoice-amount-table">
                <tbody>
                  {amountRows.map((row) => (
                    <tr key={row.label}>
                      <td className="invoice-amount-label">{row.label} :</td>
                      <td className={`invoice-amount-value${row.dark ? " is-dark" : ""}`}>
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <table className="invoice-detail-table">
              <tbody>
                {detailRows.map((row) => (
                  <tr key={row.label}>
                    <td className="invoice-detail-label">{row.label}:</td>
                    <td
                      className={[
                        "invoice-detail-value",
                        row.statement ? "invoice-statement-value" : "",
                      ].join(" ")}
                    >
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}

function InvoiceMetaItem({
  label,
  value,
  align = "right",
}: {
  label: string;
  value: string;
  align?: "right" | "center" | "left";
}) {
  const alignmentClass = align === "center" ? "center" : align === "left" ? "left" : "right";

  return (
    <div className={`invoice-meta-item ${alignmentClass}`}>
      <span className="invoice-meta-label">{label}</span>
      <strong className="invoice-meta-value">{value}</strong>
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
