function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatAmount(value) {
  const amount = Number(value ?? 0);
  return `${new Intl.NumberFormat("ar-IQ-u-nu-arab", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)} د.ع`;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getPaymentLabel(method) {
  return method === "mastercard" ? "ماستر كارد" : "نقداً";
}

function buildThermalItems(items) {
  return items
    .map(
      (item) => `
        <div class="item-row">
          <div class="item-main">
            <div class="item-name">${escapeHtml(item.product_name)}</div>
            <div class="item-total">${escapeHtml(formatAmount(item.total))}</div>
          </div>
          <div class="item-sub">
            <span>${escapeHtml(`×${item.quantity}`)}</span>
            <span>${escapeHtml(formatAmount(item.price))}</span>
          </div>
        </div>`,
    )
    .join("");
}

function buildThermalHtml({ order, items, testMode = false }) {
  return `<!doctype html>
  <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(order.order_code || "AJN")}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }

        html,
        body {
          width: 80mm;
          margin: 0;
          padding: 0;
          background: white;
          color: black;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.45;
          direction: rtl;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        * {
          box-sizing: border-box;
        }

        .invoice {
          width: 76mm;
          margin: 0 auto;
          padding: 4mm;
          box-sizing: border-box;
        }

        .center {
          text-align: center;
        }

        .brand {
          margin: 0 0 1mm;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0;
        }

        .agent-label {
          margin: 0;
          font-size: 10px;
          font-weight: 700;
        }

        .divider {
          margin: 3mm 0;
          border: 0;
          border-top: 1px dashed #000;
        }

        .meta-stack,
        .summary-stack {
          display: block;
        }

        .meta-row,
        .summary-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 3mm;
          padding: 1.5mm 0;
          border-bottom: 1px dashed #d1d5db;
        }

        .meta-row:last-child,
        .summary-row:last-child {
          border-bottom: 0;
        }

        .meta-label,
        .summary-label {
          min-width: 21mm;
          font-size: 11px;
          font-weight: 700;
        }

        .meta-value,
        .summary-value {
          flex: 1;
          text-align: left;
          font-size: 11px;
          font-weight: 500;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .section-title {
          margin: 0 0 2mm;
          font-size: 12px;
          font-weight: 700;
        }

        .items {
          margin-top: 1mm;
        }

        .item-row {
          padding: 2mm 0;
          border-bottom: 1px dashed #d1d5db;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .item-row:last-child {
          border-bottom: 0;
        }

        .item-main,
        .item-sub {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 3mm;
        }

        .item-name {
          flex: 1;
          font-size: 12px;
          font-weight: 700;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .item-total {
          min-width: 19mm;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .item-sub {
          margin-top: 1mm;
          font-size: 11px;
        }

        .item-sub span:last-child {
          white-space: nowrap;
        }

        .grand-total .summary-label,
        .grand-total .summary-value {
          font-size: 12px;
          font-weight: 700;
        }

        .footer-note {
          margin-top: 3mm;
          font-size: 10px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <main class="invoice">
        <section class="center">
          <h1 class="brand">مجموعة علي جان نهاد لتنظيم المناسبات</h1>
          <p class="agent-label">${testMode ? "AJN PRINT TEST" : "AJN PRINT AGENT"}</p>
        </section>

        <hr class="divider" />

        <section class="meta-stack">
          <div class="meta-row">
            <div class="meta-label">رقم التتبع</div>
            <div class="meta-value">${escapeHtml(order.order_code)}</div>
          </div>
          <div class="meta-row">
            <div class="meta-label">التاريخ</div>
            <div class="meta-value">${escapeHtml(formatDateTime(order.created_at))}</div>
          </div>
          <div class="meta-row">
            <div class="meta-label">الاسم</div>
            <div class="meta-value">${escapeHtml(order.customer_name)}</div>
          </div>
          <div class="meta-row">
            <div class="meta-label">الهاتف</div>
            <div class="meta-value">${escapeHtml(order.phone)}</div>
          </div>
          <div class="meta-row">
            <div class="meta-label">المدينة</div>
            <div class="meta-value">${escapeHtml(order.city)}</div>
          </div>
          <div class="meta-row">
            <div class="meta-label">العنوان</div>
            <div class="meta-value">${escapeHtml(order.address)}</div>
          </div>
          ${
            order.google_maps_url
              ? `<div class="meta-row">
                  <div class="meta-label">الموقع</div>
                  <div class="meta-value">${escapeHtml(order.google_maps_url)}</div>
                </div>`
              : ""
          }
          <div class="meta-row">
            <div class="meta-label">الدفع</div>
            <div class="meta-value">${escapeHtml(getPaymentLabel(order.payment_method))}</div>
          </div>
        </section>

        <hr class="divider" />

        <section>
          <h2 class="section-title">المنتجات</h2>
          <div class="items">
            ${buildThermalItems(items)}
          </div>
        </section>

        <hr class="divider" />

        <section class="summary-stack">
          <div class="summary-row">
            <div class="summary-label">المجموع</div>
            <div class="summary-value">${escapeHtml(formatAmount(order.subtotal))}</div>
          </div>
          <div class="summary-row">
            <div class="summary-label">التوصيل</div>
            <div class="summary-value">${escapeHtml(formatAmount(order.delivery_fee))}</div>
          </div>
          <div class="summary-row">
            <div class="summary-label">التغليف</div>
            <div class="summary-value">${escapeHtml(formatAmount(order.wrapping_price))}</div>
          </div>
          <div class="summary-row grand-total">
            <div class="summary-label">الإجمالي</div>
            <div class="summary-value">${escapeHtml(formatAmount(order.total))}</div>
          </div>
        </section>

        ${
          order.driver_notes
            ? `<hr class="divider" />
               <section class="meta-stack">
                 <div class="meta-row">
                   <div class="meta-label">ملاحظات</div>
                   <div class="meta-value">${escapeHtml(order.driver_notes)}</div>
                 </div>
               </section>`
            : ""
        }

        <p class="footer-note">AJN</p>
      </main>
    </body>
  </html>`;
}

function buildA4Html({ order, items, testMode = false }) {
  const itemsSummary = items
    .map((item) => `${item.product_name} ×${item.quantity}`)
    .join(" + ");
  const addressLine = [order.city, order.address].filter(Boolean).join(" - ");
  const extraCharges = Number(order.delivery_fee ?? 0) + Number(order.wrapping_price ?? 0);

  return `<!doctype html>
  <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(order.order_code || "AJN")}</title>
      <style>
        @page {
          size: 20cm 14cm;
          margin: 0;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          width: 20cm;
          height: 14cm;
          background: #fff;
          color: #000;
          font-family: Arial, sans-serif;
          direction: rtl;
          overflow: visible;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .sheet {
          width: 20cm;
          height: 14cm;
          margin: 0 auto;
          padding: 5mm;
        }

        .invoice-shell {
          width: 100%;
          height: 100%;
          border: 1px solid #000;
          padding: 4mm;
          display: grid;
          grid-template-rows: auto auto 1fr;
          gap: 3mm;
        }

        .header {
          display: grid;
          grid-template-columns: 52mm 1fr;
          gap: 4mm;
          padding-bottom: 3mm;
          border-bottom: 1px solid #000;
        }

        .brand {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          line-height: 1.1;
        }

        .logo-column {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: space-between;
        }

        .logo-mark {
          width: 31mm;
          height: 31mm;
          border-radius: 999px;
          border: 3px solid #666;
          display: grid;
          place-items: center;
          background: radial-gradient(circle at 72% 74%, #d3a330 0 26%, transparent 27%),
            linear-gradient(135deg, #585858 0%, #2d2d2d 65%, #0f0f0f 100%);
          color: #fff;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: 0.16em;
        }

        .logo-copy {
          margin-top: 2mm;
          text-align: right;
        }

        .logo-copy h2 {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
        }

        .logo-copy p {
          margin: 1mm 0 0;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.24em;
          color: rgba(0, 0, 0, 0.72);
        }

        .header-info {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: right;
        }

        .header-info p {
          margin: 1.2mm 0 0;
          font-size: 11px;
          font-weight: 700;
        }

        .header-subtitle {
          margin-top: 1.4mm;
          font-size: 11px;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.82);
        }

        .meta-bar {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 3mm;
          padding-bottom: 3mm;
          border-bottom: 1px solid #000;
        }

        .meta-item {
          display: grid;
          gap: 1mm;
          font-size: 11px;
          font-weight: 700;
        }

        .meta-item.center {
          text-align: center;
        }

        .meta-item.left {
          text-align: left;
        }

        .meta-item span {
          font-size: 10px;
          color: rgba(0, 0, 0, 0.72);
        }

        .meta-item strong {
          font-size: 12px;
          color: #000;
        }

        .details {
          min-height: 0;
          display: grid;
          grid-template-rows: auto 1fr;
          border: 1px solid #000;
          border-radius: 5mm;
          overflow: hidden;
        }

        .details-title {
          padding: 2mm 0;
          text-align: center;
          font-size: 12px;
          font-weight: 800;
          border-bottom: 1px solid #000;
        }

        .details-content {
          display: grid;
          grid-template-columns: 44mm 1fr;
          min-height: 0;
        }

        .amounts {
          border-left: 1px solid #000;
        }

        .amount-row {
          display: grid;
          grid-template-columns: 1fr 24mm;
          border-bottom: 1px solid #000;
        }

        .amount-row:last-child {
          border-bottom: 0;
        }

        .amount-label {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 3.3mm 2.6mm;
          font-size: 11px;
          font-weight: 800;
        }

        .amount-value {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3.3mm 2mm;
          font-size: 11px;
          font-weight: 800;
        }

        .amount-value.dark {
          background: #515151;
          color: #fff;
        }

        .detail-grid {
          display: grid;
          grid-template-rows: repeat(6, 1fr) auto;
          min-height: 0;
        }

        .detail-row {
          display: grid;
          grid-template-columns: 30mm 1fr;
          border-bottom: 1px solid #000;
        }

        .detail-row:last-child {
          border-bottom: 0;
        }

        .detail-label {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          background: #ececec;
          padding: 2.4mm;
          font-size: 11px;
          font-weight: 800;
        }

        .detail-value {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 2.4mm 2.8mm;
          font-size: 11px;
          font-weight: 800;
          text-align: right;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .statement-value {
          line-height: 1.55;
        }
      </style>
    </head>
    <body>
      <main class="sheet">
        <section class="invoice-shell">
          <header class="header">
            <div class="logo-column">
              <div class="logo-mark">AJN</div>
              <div class="logo-copy">
                <h2>علي جان نهاد</h2>
                <p>ALI JAN NIHAD</p>
              </div>
            </div>

            <div class="header-info">
              <div>
                <h1 class="brand">مجموعة علي جان نهاد</h1>
                <div class="header-subtitle">${testMode ? "فاتورة تجريبية" : "طلبات المتجر"}</div>
              </div>
              <div>
                <p>طريقة الدفع: ${escapeHtml(getPaymentLabel(order.payment_method))}</p>
                <p>الهاتف: ${escapeHtml(order.phone)}</p>
                <p>${escapeHtml(order.google_maps_url || addressLine || "-")}</p>
              </div>
            </div>
          </header>

          <section class="meta-bar">
            <div class="meta-item">
              <span>التاريخ</span>
              <strong>${escapeHtml(formatDateTime(order.created_at))}</strong>
            </div>
            <div class="meta-item center">
              <span>رقم الفاتورة</span>
              <strong>${escapeHtml(order.order_code)}</strong>
            </div>
            <div class="meta-item left">
              <span>اسم العميل</span>
              <strong>${escapeHtml(order.customer_name)}</strong>
            </div>
          </section>

          <section class="details">
            <div class="details-title">تفاصيل الطلب</div>

            <div class="details-content">
              <div class="amounts">
                <div class="amount-row">
                  <div class="amount-label">المجموع الجزئي :</div>
                  <div class="amount-value dark">${escapeHtml(formatAmount(order.subtotal))}</div>
                </div>
                <div class="amount-row">
                  <div class="amount-label">التوصيل والتغليف :</div>
                  <div class="amount-value">${escapeHtml(formatAmount(extraCharges))}</div>
                </div>
                <div class="amount-row">
                  <div class="amount-label">المجموع النهائي :</div>
                  <div class="amount-value dark">${escapeHtml(formatAmount(order.total))}</div>
                </div>
              </div>

              <div class="detail-grid">
                <div class="detail-row">
                  <div class="detail-label">اسم العميل:</div>
                  <div class="detail-value">${escapeHtml(order.customer_name)}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">الهاتف:</div>
                  <div class="detail-value">${escapeHtml(order.phone)}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">العنوان:</div>
                  <div class="detail-value">${escapeHtml(addressLine || "-")}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">القسم:</div>
                  <div class="detail-value">طلبات المتجر</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">الحالة:</div>
                  <div class="detail-value">${escapeHtml(order.status || "طلب جديد")}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">الوقت:</div>
                  <div class="detail-value">${escapeHtml(formatDateTime(order.created_at))}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">البيان:</div>
                  <div class="detail-value statement-value">${escapeHtml(itemsSummary || "لا توجد منتجات")}</div>
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>
    </body>
  </html>`;
}

function buildInvoiceHtml(payload) {
  return payload.settings?.invoiceType === "a4" ? buildA4Html(payload) : buildThermalHtml(payload);
}

module.exports = {
  buildInvoiceHtml,
};
