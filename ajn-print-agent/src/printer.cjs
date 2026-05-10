const { buildInvoiceHtml } = require("./invoice-template.cjs");

function loadHtml(window, html) {
  return window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

async function createHiddenPrintWindow(BrowserWindow, settings) {
  const thermal = settings?.invoiceType !== "a4";
  const window = new BrowserWindow({
    show: false,
    width: thermal ? 420 : 900,
    height: thermal ? 1800 : 1200,
    backgroundColor: "#ffffff",
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  return window;
}

function buildPrintOptions(settings, deviceName) {
  const thermal = settings?.invoiceType !== "a4";
  const base = {
    silent: true,
    printBackground: true,
    margins: {
      marginType: "none",
    },
  };

  if (deviceName) {
    base.deviceName = deviceName;
  }

  if (thermal) {
    base.pageSize = {
      width: 80000,
      height: 200000,
    };
    base.copies = 1;
    return base;
  }

  base.copies = Math.max(1, Number(settings.copies) || 1);
  return base;
}

async function sendPrintJob(printWindow, settings, deviceName) {
  await new Promise((resolve, reject) => {
    printWindow.webContents.print(buildPrintOptions(settings, deviceName), (success, failureReason) => {
      if (!success) {
        reject(new Error(failureReason || "فشلت الطباعة."));
        return;
      }

      resolve();
    });
  });
}

async function printHtml(BrowserWindow, html, settings) {
  const printWindow = await createHiddenPrintWindow(BrowserWindow, settings);
  await loadHtml(printWindow, html);

  await new Promise((resolve) => {
    printWindow.webContents.once("did-finish-load", resolve);
  });

  const selectedPrinterName = String(settings?.printerName || "").trim();

  try {
    if (selectedPrinterName) {
      try {
        await sendPrintJob(printWindow, settings, selectedPrinterName);
      } catch (error) {
        console.error("PRINT_SELECTED_PRINTER_FAILED:", selectedPrinterName, error);
        await sendPrintJob(printWindow, settings, undefined);
      }
    } else {
      await sendPrintJob(printWindow, settings, undefined);
    }
  } finally {
    printWindow.close();
  }
}

async function printOrderInvoice(BrowserWindow, payload) {
  const html = buildInvoiceHtml(payload);
  await printHtml(BrowserWindow, html, payload.settings);
}

async function printTestInvoice(BrowserWindow, settings) {
  const html = buildInvoiceHtml({
    settings,
    testMode: true,
    order: {
      order_code: "AJN-TEST",
      customer_name: "اختبار الطابعة",
      phone: "0000000000",
      city: "AJN",
      address: "اختبار",
      google_maps_url: "",
      payment_method: "cash",
      driver_notes: "",
      subtotal: 0,
      delivery_fee: 0,
      wrapping_price: 0,
      total: 0,
      created_at: new Date().toISOString(),
    },
    items: [
      {
        product_name: "فاتورة تجريبية",
        quantity: 1,
        price: 0,
        total: 0,
      },
    ],
  });

  await printHtml(BrowserWindow, html, settings);
}

module.exports = {
  printOrderInvoice,
  printTestInvoice,
};
