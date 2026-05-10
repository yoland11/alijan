/* global window, document, console */

const agentAPI = window.agentAPI || window.ajnPrintAgent || null;
const isElectronRuntime = Boolean(agentAPI);
const MANUAL_OPTION_VALUE = "__manual__";

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
  printerNameManual: document.getElementById("printer-name-manual"),
  printerStatus: document.getElementById("printer-status"),
  defaultPrinter: document.getElementById("default-printer"),
  refreshPrinters: document.getElementById("refresh-printers"),
  debugPrinters: document.getElementById("debug-printers"),
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

let currentPrinters = [];
let currentSettings = null;
let printerMode = "select";

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

function setElectronOnlyControlsDisabled(disabled) {
  [
    elements.settingsForm.querySelector('button[type="submit"]'),
    elements.startPrinting,
    elements.stopPrinting,
    elements.testPrinter,
    elements.retryFailed,
    elements.refreshPrinters,
    elements.debugPrinters,
  ].forEach((element) => {
    if (element) {
      element.disabled = disabled;
    }
  });
}

function createFallbackBootstrap() {
  return {
    settings: {
      supabaseUrl: "",
      supabaseServiceRoleKey: "",
      invoiceType: "thermal-80",
      copies: 1,
      printerName: "",
      adminUrl: "https://ali-jan1.vercel.app/admin",
      pollIntervalMs: 5000,
      autoStartPrinting: true,
      launchOnStartup: false,
    },
    state: {
      connected: false,
      running: false,
      busy: false,
      pendingCount: 0,
      lastPrintedOrderCode: "",
      lastPrintedAt: "",
      lastError: "هذه معاينة HTML فقط. شغّل AJN Print Agent عبر Electron.",
    },
    printers: [],
    printersError: "شغّل التطبيق عبر npm run dev أو npm run print-agent:dev",
  };
}

function setPrinterMode(mode) {
  printerMode = mode;
  const manualVisible = mode === "manual";
  elements.printerName.style.display = manualVisible ? "none" : "block";
  elements.printerNameManual.style.display = manualVisible ? "block" : "none";
}

function getSelectedPrinterName() {
  if (printerMode === "manual") {
    return elements.printerNameManual.value.trim();
  }

  const selected = elements.printerName.value;
  if (selected === MANUAL_OPTION_VALUE) {
    return elements.printerNameManual.value.trim();
  }

  return selected.trim();
}

function updatePrinterStatus(message) {
  setText(elements.printerStatus, message);
}

function updateDefaultPrinterLabel(printers) {
  const defaultPrinter = (Array.isArray(printers) ? printers : []).find((printer) => printer.isDefault);
  setText(elements.defaultPrinter, `الطابعة الافتراضية: ${defaultPrinter?.displayName || "غير محددة"}`);
}

function populatePrinterSelect(settings, printers, errorMessage = "") {
  currentPrinters = Array.isArray(printers) ? printers : [];
  const selectedName = String(settings?.printerName || "").trim();
  const hasPrinters = currentPrinters.length > 0;
  const selectedExists = hasPrinters && currentPrinters.some((printer) => printer.name === selectedName);
  updateDefaultPrinterLabel(currentPrinters);

  if (!hasPrinters) {
    elements.printerName.innerHTML = `<option value="">لم يتم العثور على أي طابعة</option>`;
    elements.printerName.value = "";
    elements.printerNameManual.value = selectedName;
    setPrinterMode("manual");
    updatePrinterStatus(errorMessage || "لا توجد طابعات. اكتب الاسم يدويًا.");
    return;
  }

  const options = [
    '<option value="">استخدام الطابعة الافتراضية</option>',
    ...currentPrinters.map((printer) => {
      const selected = printer.name === selectedName ? " selected" : "";
      const suffix = printer.isDefault ? " (افتراضية)" : "";
      return `<option value="${printer.name}"${selected}>${printer.displayName}${suffix}</option>`;
    }),
    `<option value="${MANUAL_OPTION_VALUE}">إدخال يدوي</option>`,
  ].join("");

  elements.printerName.innerHTML = options;
  elements.printerNameManual.value = selectedExists ? "" : selectedName;

  if (selectedName && !selectedExists) {
    elements.printerName.value = MANUAL_OPTION_VALUE;
    setPrinterMode("manual");
    updatePrinterStatus(errorMessage || "لم تُطابق الطابعة القائمة الحالية. اكتب الاسم يدويًا.");
    return;
  }

  setPrinterMode("select");
  elements.printerName.value = selectedName || "";

  if (!selectedName) {
    updatePrinterStatus(errorMessage || "تم العثور على الطابعات. سيتم استخدام الطابعة الافتراضية.");
    return;
  }

  updatePrinterStatus(errorMessage || "تم العثور على الطابعات.");
}

function renderSettings(settings, printers = currentPrinters, printersError = "") {
  currentSettings = settings;
  elements.supabaseUrl.value = settings.supabaseUrl || "";
  elements.supabaseKey.value = settings.supabaseServiceRoleKey || "";
  elements.invoiceType.value = settings.invoiceType || "thermal-80";
  elements.copies.value = String(settings.copies || 1);
  elements.adminUrl.value = settings.adminUrl || "";
  elements.pollInterval.value = String(settings.pollIntervalMs || 5000);
  elements.autoStartPrinting.checked = settings.autoStartPrinting !== false;
  elements.launchOnStartup.checked = Boolean(settings.launchOnStartup);
  populatePrinterSelect(settings, printers, printersError);
}

async function refreshPrinters() {
  updatePrinterStatus("جاري تحديث قائمة الطابعات...");

  if (!agentAPI?.listPrinters) {
    populatePrinterSelect(currentSettings || {}, [], "يجب تشغيل التطبيق عبر Electron.");
    return;
  }

  try {
    const result = await agentAPI.listPrinters();
    populatePrinterSelect(currentSettings || {}, result.printers || [], result.error || "");
  } catch (error) {
    populatePrinterSelect(currentSettings || {}, [], error instanceof Error ? error.message : "تعذر جلب الطابعات.");
  }
}

async function refreshBootstrap() {
  const bootstrap = agentAPI?.getBootstrap ? await agentAPI.getBootstrap() : createFallbackBootstrap();
  renderState(bootstrap.state);
  renderSettings(bootstrap.settings, bootstrap.printers || [], bootstrap.printersError || "");
  setElectronOnlyControlsDisabled(!isElectronRuntime);
}

elements.printerName.addEventListener("change", () => {
  if (elements.printerName.value === MANUAL_OPTION_VALUE) {
    setPrinterMode("manual");
    updatePrinterStatus("اكتب اسم الطابعة يدويًا.");
    elements.printerNameManual.focus();
    return;
  }

  setPrinterMode("select");
  if (!elements.printerName.value) {
    updatePrinterStatus("سيتم استخدام الطابعة الافتراضية.");
    return;
  }

  updatePrinterStatus("تم اختيار الطابعة.");
});

elements.refreshPrinters.addEventListener("click", async () => {
  await refreshPrinters();
});

elements.debugPrinters.addEventListener("click", async () => {
  if (!agentAPI?.debugPrinters) {
    updatePrinterStatus("يجب تشغيل التطبيق عبر Electron.");
    return;
  }

  const printers = await agentAPI.debugPrinters();
  console.log("PRINTERS:", printers);
  updatePrinterStatus(printers.length ? "تم العثور على الطابعات" : "لا توجد طابعات");
});

elements.settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!agentAPI?.saveSettings) {
    updatePrinterStatus("يجب تشغيل التطبيق عبر Electron.");
    return;
  }

  const result = await agentAPI.saveSettings({
    supabaseUrl: elements.supabaseUrl.value,
    supabaseServiceRoleKey: elements.supabaseKey.value,
    invoiceType: elements.invoiceType.value,
    copies: Number(elements.copies.value),
    printerName: getSelectedPrinterName(),
    adminUrl: elements.adminUrl.value,
    pollIntervalMs: Number(elements.pollInterval.value),
    autoStartPrinting: elements.autoStartPrinting.checked,
    launchOnStartup: elements.launchOnStartup.checked,
  });

  currentSettings = result.settings;
  renderState(result.state);
  await refreshPrinters();
});

elements.startPrinting.addEventListener("click", async () => {
  if (!agentAPI?.startWatcher) {
    updatePrinterStatus("يجب تشغيل التطبيق عبر Electron.");
    return;
  }

  const state = await agentAPI.startWatcher();
  renderState(state);
});

elements.stopPrinting.addEventListener("click", async () => {
  if (!agentAPI?.stopWatcher) {
    updatePrinterStatus("يجب تشغيل التطبيق عبر Electron.");
    return;
  }

  const state = await agentAPI.stopWatcher();
  renderState(state);
});

elements.testPrinter.addEventListener("click", async () => {
  if (!agentAPI?.testPrint) {
    updatePrinterStatus("يجب تشغيل التطبيق عبر Electron.");
    return;
  }

  try {
    const result = await agentAPI.testPrint({
      printerName: getSelectedPrinterName(),
    });
    renderState(result.state || result);
    updatePrinterStatus(result.message || "تم إرسال الطباعة بنجاح");
  } catch (error) {
    updatePrinterStatus(error instanceof Error ? error.message : "فشلت طباعة الاختبار.");
  }
});

elements.retryFailed.addEventListener("click", async () => {
  if (!agentAPI?.retryFailed) {
    updatePrinterStatus("يجب تشغيل التطبيق عبر Electron.");
    return;
  }

  const state = await agentAPI.retryFailed();
  renderState(state);
});

elements.openAdmin.addEventListener("click", async () => {
  if (!agentAPI?.openAdmin) {
    if (currentSettings?.adminUrl) {
      window.open(currentSettings.adminUrl, "_blank", "noopener,noreferrer");
    }
    return;
  }

  await agentAPI.openAdmin();
});

if (agentAPI?.onState) {
  agentAPI.onState((state) => {
    renderState(state);
  });
}

void refreshBootstrap();
