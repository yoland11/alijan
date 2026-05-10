const path = require("node:path");
const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");

const { createSettingsStore } = require("./src/settings.cjs");
const { createWatcher } = require("./src/watcher.cjs");

let mainWindow = null;
let settingsStore = null;
let watcher = null;

async function listSystemPrinters() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return [];
  }

  try {
    const printers = await mainWindow.webContents.getPrintersAsync();
    return printers.map((printer) => printer.name).filter(Boolean).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "تعذر جلب الطابعات من النظام.");
  }
}

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
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send("agent:state", watcher.getState());
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

  createWindow();
  await watcher.refreshConnection();

  if (settings.autoStartPrinting) {
    await watcher.start();
  }

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
  ipcMain.handle("agent:stop-printing", async () => watcher.stop());
  ipcMain.handle("agent:test-printer", async () => {
    await watcher.testPrinter();
    return watcher.getState();
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
  ipcMain.handle("agent:open-admin", async () => {
    const settings = settingsStore.get();
    await shell.openExternal(settings.adminUrl || "https://ali-jan1.vercel.app/admin");
    return true;
  });

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
