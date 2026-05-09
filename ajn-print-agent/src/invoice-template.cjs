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

function buildA4Rows(items) {
  return items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.product_name)}</td>
          <td>${escapeHtml(item.quantity)}</td>
          <td>${escapeHtml(formatAmount(item.price))}</td>
          <td>${escapeHtml(formatAmount(item.total))}</td>
        </tr>`,
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
  return `<!doctype html>
  <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(order.order_code || "AJN")}</title>
      <style>
        @page {
          size: A4;
          margin: 8mm;
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          background: #fff;
          color: #000;
          font-family: Arial, sans-serif;
          font-size: 13px;
        }
        .sheet {
          width: 190mm;
          margin: 0 auto;
        }
        .header {
          border-bottom: 1px solid #000;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }
        .brand {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 4px;
        }
        .sub {
          font-size: 11px;
          letter-spacing: 0.24em;
          color: #555;
          margin: 0;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 12px;
        }
        .meta-card {
          border: 1px solid #000;
          border-radius: 10px;
          padding: 8px;
        }
        .label {
          font-size: 11px;
          color: #555;
          margin-bottom: 4px;
        }
        .value {
          font-weight: 700;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        th, td {
          border: 1px solid #000;
          padding: 6px;
          text-align: right;
          vertical-align: top;
        }
        th {
          background: #f3f3f3;
        }
        .summary {
          border: 1px solid #000;
          border-radius: 10px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 10px;
          border-top: 1px solid #000;
        }
        .summary-row:first-child {
          border-top: 0;
        }
        .summary-row strong {
          font-size: 15px;
        }
        .note {
          margin-top: 10px;
          font-size: 11px;
          color: #333;
          line-height: 1.8;
        }
      </style>
    </head>
    <body>
      <main class="sheet">
        <header class="header">
          <h1 class="brand">مجموعة علي جان نهاد لتنظيم المناسبات</h1>
          <p class="sub">${testMode ? "AJN PRINT TEST" : "AJN PRINT AGENT"}</p>
        </header>

        <section class="meta-grid">
          <div class="meta-card">
            <div class="label">رقم التتبع</div>
            <div class="value">${escapeHtml(order.order_code)}</div>
          </div>
          <div class="meta-card">
            <div class="label">التاريخ</div>
            <div class="value">${escapeHtml(formatDateTime(order.created_at))}</div>
          </div>
          <div class="meta-card">
            <div class="label">اسم الزبون</div>
            <div class="value">${escapeHtml(order.customer_name)}</div>
          </div>
          <div class="meta-card">
            <div class="label">رقم الهاتف</div>
            <div class="value">${escapeHtml(order.phone)}</div>
          </div>
          <div class="meta-card">
            <div class="label">المحافظة / المدينة</div>
            <div class="value">${escapeHtml(order.city)}</div>
          </div>
          <div class="meta-card">
            <div class="label">الدفع</div>
            <div class="value">${escapeHtml(getPaymentLabel(order.payment_method))}</div>
          </div>
          <div class="meta-card" style="grid-column: 1 / -1;">
            <div class="label">العنوان</div>
            <div class="value">${escapeHtml(order.address)}</div>
          </div>
          ${
            order.google_maps_url
              ? `<div class="meta-card" style="grid-column: 1 / -1;">
                  <div class="label">Google Maps</div>
                  <div class="value">${escapeHtml(order.google_maps_url)}</div>
                </div>`
              : ""
          }
        </section>

        <table>
          <thead>
            <tr>
              <th>المنتج</th>
              <th>الكمية</th>
              <th>السعر</th>
              <th>المجموع</th>
            </tr>
          </thead>
          <tbody>
            ${buildA4Rows(items)}
          </tbody>
        </table>

        <section class="summary">
          <div class="summary-row"><span>المجموع</span><span>${escapeHtml(formatAmount(order.subtotal))}</span></div>
          <div class="summary-row"><span>التوصيل</span><span>${escapeHtml(formatAmount(order.delivery_fee))}</span></div>
          <div class="summary-row"><span>التغليف</span><span>${escapeHtml(formatAmount(order.wrapping_price))}</span></div>
          <div class="summary-row"><strong>الإجمالي</strong><strong>${escapeHtml(formatAmount(order.total))}</strong></div>
        </section>

        ${
          order.driver_notes
            ? `<p class="note">تعليمات السائق: ${escapeHtml(order.driver_notes)}</p>`
            : ""
        }
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
