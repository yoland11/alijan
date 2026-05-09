/* global window, document */

const elements = {
  connectionStatus: document.getElementById("connection-status"),
  printingStatus: document.getElementById("printing-status"),
  lastOrder: document.getElementById("last-order"),
  lastOrderTime: document.getElementById("last-order-time"),
  pendingCount: document.getElementById("pending-count"),
  errorText: document.getElementById("error-text"),
  settingsForm: document.getElementById("settings-form"),
  supabaseUrl: document.getElementById("supabase-url"),
  supabaseKey: document.getElementById("supabase-key"),
  invoiceType: document.getElementById("invoice-type"),
  copies: document.getElementById("copies"),
  printerName: document.getElementById("printer-name"),
  adminUrl: document.getElementById("admin-url"),
  pollInterval: document.getElementById("poll-interval"),
  autoStartPrinting: document.getElementById("auto-start-printing"),
  launchOnStartup: document.getElementById("launch-on-startup"),
  startPrinting: document.getElementById("start-printing"),
  stopPrinting: document.getElementById("stop-printing"),
  testPrinter: document.getElementById("test-printer"),
  retryFailed: document.getElementById("retry-failed"),
  openAdmin: document.getElementById("open-admin"),
};

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function renderState(state) {
  setText(elements.connectionStatus, state.connected ? "متصل" : "غير متصل");
  setText(elements.printingStatus, state.running ? (state.busy ? "يعمل" : "جاهز") : "متوقف");
  setText(elements.lastOrder, state.lastPrintedOrderCode || "-");
  setText(elements.lastOrderTime, state.lastPrintedAt ? formatDate(state.lastPrintedAt) : "-");
  setText(elements.pendingCount, String(state.pendingCount ?? 0));
  setText(elements.errorText, state.lastError || "لا توجد أخطاء.");
}

function renderSettings(settings, printers) {
  elements.supabaseUrl.value = settings.supabaseUrl || "";
  elements.supabaseKey.value = settings.supabaseServiceRoleKey || "";
  elements.invoiceType.value = settings.invoiceType || "thermal-80";
  elements.copies.value = String(settings.copies || 1);
  elements.adminUrl.value = settings.adminUrl || "";
  elements.pollInterval.value = String(settings.pollIntervalMs || 5000);
  elements.autoStartPrinting.checked = settings.autoStartPrinting !== false;
  elements.launchOnStartup.checked = Boolean(settings.launchOnStartup);

  const printerOptions = ['<option value="">الطابعة الافتراضية</option>']
    .concat(
      printers.map((printerName) => {
        const selected = printerName === settings.printerName ? " selected" : "";
        return `<option value="${printerName}"${selected}>${printerName}</option>`;
      }),
    )
    .join("");

  elements.printerName.innerHTML = printerOptions;
  elements.printerName.value = settings.printerName || "";
}

async function refreshBootstrap() {
  const bootstrap = await window.ajnPrintAgent.getBootstrap();
  const printers = await window.ajnPrintAgent.listPrinters();
  renderState(bootstrap.state);
  renderSettings(bootstrap.settings, printers);
}

elements.settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const result = await window.ajnPrintAgent.saveSettings({
    supabaseUrl: elements.supabaseUrl.value,
    supabaseServiceRoleKey: elements.supabaseKey.value,
    invoiceType: elements.invoiceType.value,
    copies: Number(elements.copies.value),
    printerName: elements.printerName.value,
    adminUrl: elements.adminUrl.value,
    pollIntervalMs: Number(elements.pollInterval.value),
    autoStartPrinting: elements.autoStartPrinting.checked,
    launchOnStartup: elements.launchOnStartup.checked,
  });

  const printers = await window.ajnPrintAgent.listPrinters();
  renderState(result.state);
  renderSettings(result.settings, printers);
});

elements.startPrinting.addEventListener("click", async () => {
  const state = await window.ajnPrintAgent.startPrinting();
  renderState(state);
});

elements.stopPrinting.addEventListener("click", async () => {
  const state = await window.ajnPrintAgent.stopPrinting();
  renderState(state);
});

elements.testPrinter.addEventListener("click", async () => {
  const state = await window.ajnPrintAgent.testPrinter();
  renderState(state);
});

elements.retryFailed.addEventListener("click", async () => {
  const state = await window.ajnPrintAgent.retryFailed();
  renderState(state);
});

elements.openAdmin.addEventListener("click", async () => {
  await window.ajnPrintAgent.openAdmin();
});

window.ajnPrintAgent.onState((state) => {
  renderState(state);
});

void refreshBootstrap();
