const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_SETTINGS = {
  supabaseUrl: "",
  supabaseServiceRoleKey: "",
  invoiceType: "thermal-80",
  copies: 1,
  printerName: "",
  launchOnStartup: false,
  adminUrl: "https://ali-jan1.vercel.app/admin",
  pollIntervalMs: 5000,
  autoStartPrinting: true,
};

function ensureNumber(value, fallback) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSettings(raw) {
  return {
    supabaseUrl: String(raw?.supabaseUrl ?? "").trim(),
    supabaseServiceRoleKey: String(raw?.supabaseServiceRoleKey ?? "").trim(),
    invoiceType: raw?.invoiceType === "a4" ? "a4" : "thermal-80",
    copies: Math.max(1, Math.min(3, ensureNumber(raw?.copies, DEFAULT_SETTINGS.copies))),
    printerName: String(raw?.printerName ?? "").trim(),
    launchOnStartup: Boolean(raw?.launchOnStartup),
    adminUrl: String(raw?.adminUrl ?? DEFAULT_SETTINGS.adminUrl).trim() || DEFAULT_SETTINGS.adminUrl,
    pollIntervalMs: Math.max(3000, ensureNumber(raw?.pollIntervalMs, DEFAULT_SETTINGS.pollIntervalMs)),
    autoStartPrinting: raw?.autoStartPrinting !== false,
  };
}

function createSettingsStore(app) {
  const settingsPath = path.join(app.getPath("userData"), "print-agent-settings.json");
  let currentSettings = { ...DEFAULT_SETTINGS };

  function load() {
    try {
      if (fs.existsSync(settingsPath)) {
        const parsed = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
        currentSettings = normalizeSettings(parsed);
      } else {
        currentSettings = { ...DEFAULT_SETTINGS };
        persist();
      }
    } catch {
      currentSettings = { ...DEFAULT_SETTINGS };
      persist();
    }

    return currentSettings;
  }

  function persist() {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 2), "utf8");
  }

  function save(patch) {
    currentSettings = normalizeSettings({
      ...currentSettings,
      ...patch,
    });
    persist();
    return currentSettings;
  }

  function get() {
    return currentSettings;
  }

  return {
    load,
    save,
    get,
    path: settingsPath,
  };
}

module.exports = {
  DEFAULT_SETTINGS,
  createSettingsStore,
};
