const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");

const { createSettingsStore } = require("./src/settings.cjs");
const { createWatcher } = require("./src/watcher.cjs");

const execFileAsync = promisify(execFile);

let mainWindow = null;
let settingsStore = null;
let watcher = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 860,
    minWidth: 980,
    minHeight: 760,
    title: "AJN Print Agent",
    backgroundColor: "#050505",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);
  void mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

function emitState() {
  if (!mainWindow || mainWindow.isDestroyed() || !watcher) {
    return;
  }

  mainWindow.webContents.send("agent:state", watcher.getState());
}

function getPrimaryWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }

  return BrowserWindow.getAllWindows()[0] ?? null;
}

async function listPrintersFromSystem() {
  if (process.platform !== "darwin") {
    return [];
  }

  try {
    const { stdout } = await execFileAsync("lpstat", ["-p", "-d"]);
    const lines = stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const defaultLine = lines.find((line) => line.startsWith("system default destination:"));
    const defaultName = defaultLine ? defaultLine.split(":").slice(1).join(":").trim() : "";
    const printers = lines
      .filter((line) => line.startsWith("printer "))
      .map((line) => {
        const match = line.match(/^printer\s+(.+?)\s+/);
        const name = match?.[1]?.trim() ?? "";

        return {
          name,
          displayName: name,
          isDefault: Boolean(defaultName && name === defaultName),
          status: 0,
          source: "lpstat",
        };
      })
      .filter((printer) => printer.name);

    if (defaultName && !printers.some((printer) => printer.name === defaultName)) {
      printers.unshift({
        name: defaultName,
        displayName: defaultName,
        isDefault: true,
        status: 0,
        source: "lpstat",
      });
    }

    return printers;
  } catch {
    return [];
  }
}

async function listSystemPrinters() {
  const win = getPrimaryWindow();
  let printers = [];

  if (win && !win.isDestroyed()) {
    try {
      const result = await win.webContents.getPrintersAsync();
      printers = result
        .map((printer) => ({
          name: printer.name,
          displayName: printer.displayName || printer.name,
          isDefault: Boolean(printer.isDefault),
          status: typeof printer.status === "number" ? printer.status : 0,
          source: "electron",
        }))
        .filter((printer) => printer.name);
    } catch (error) {
      console.error("PRINTERS_ELECTRON_ERROR:", error);
    }
  }

  if (!printers.length) {
    printers = await listPrintersFromSystem();
  }

  console.log("PRINTERS:", printers);

  return printers.sort((a, b) => {
    if (a.isDefault && !b.isDefault) {
      return -1;
    }

    if (!a.isDefault && b.isDefault) {
      return 1;
    }

    return a.displayName.localeCompare(b.displayName, "ar");
  });
}

function registerIpcHandlers() {
  ipcMain.handle("agent:get-bootstrap", async () => {
    let printers = [];
    let printersError = "";

    try {
      printers = await listSystemPrinters();
    } catch (error) {
      printersError = error instanceof Error ? error.message : "تعذر جلب الطابعات.";
    }

    return {
      settings: settingsStore.get(),
      state: watcher.getState(),
      printers,
      printersError,
    };
  });

  ipcMain.handle("agent:get-settings", async () => settingsStore.get());

  ipcMain.handle("agent:save-settings", async (_event, patch) => {
    const nextSettings = settingsStore.save(patch);
    app.setLoginItemSettings({ openAtLogin: nextSettings.launchOnStartup });
    await watcher.refreshConnection();
    return {
      settings: nextSettings,
      state: watcher.getState(),
    };
  });

  ipcMain.handle("agent:start-printing", async () => watcher.start());
  ipcMain.handle("agent:start-watcher", async () => watcher.start());

  ipcMain.handle("agent:stop-printing", async () => watcher.stop());
  ipcMain.handle("agent:stop-watcher", async () => watcher.stop());

  ipcMain.handle("agent:test-printer", async (_event, input) => {
    if (input && typeof input === "object") {
      settingsStore.save(input);
    }
    await watcher.testPrinter();
    return {
      state: watcher.getState(),
      message: "تم إرسال الطباعة بنجاح",
    };
  });

  ipcMain.handle("agent:test-print", async (_event, input) => {
    if (input && typeof input === "object") {
      settingsStore.save(input);
    }
    await watcher.testPrinter();
    return {
      state: watcher.getState(),
      message: "تم إرسال الطباعة بنجاح",
    };
  });

  ipcMain.handle("agent:retry-failed", async () => {
    await watcher.retryFailed();
    return watcher.getState();
  });

  ipcMain.handle("agent:list-printers", async () => {
    try {
      return {
        printers: await listSystemPrinters(),
        error: "",
      };
    } catch (error) {
      return {
        printers: [],
        error: error instanceof Error ? error.message : "تعذر جلب الطابعات.",
      };
    }
  });

  ipcMain.handle("agent:debug-printers", async () => {
    const printers = await listSystemPrinters();
    console.log("PRINTERS:", printers);
    return printers;
  });

  ipcMain.handle("agent:open-admin", async () => {
    const settings = settingsStore.get();
    await shell.openExternal(settings.adminUrl || "https://ali-jan1.vercel.app/admin");
    return true;
  });
}

app.whenReady().then(async () => {
  settingsStore = createSettingsStore(app);
  const settings = settingsStore.load();
  app.setLoginItemSettings({ openAtLogin: settings.launchOnStartup });

  watcher = createWatcher({
    BrowserWindow,
    getSettings: () => settingsStore.get(),
    onStateChange: emitState,
  });

  registerIpcHandlers();
  createWindow();
  await watcher.refreshConnection();

  if (settings.autoStartPrinting) {
    await watcher.start();
  }

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      emitState();
    }
  });
});

app.on("before-quit", () => {
  if (watcher) {
    watcher.dispose();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
