const fs = require("node:fs");
const path = require("node:path");
const { app, BrowserWindow, Menu, shell } = require("electron");

const DEV_ADMIN_URL = "http://127.0.0.1:3000/admin/login";
const APP_TITLE = "AJN Admin Dashboard";

function normalizeUrl(url) {
  try {
    return new URL(url).toString();
  } catch {
    return null;
  }
}

function getConfigPath() {
  const packagedPath = path.join(process.resourcesPath, "runtime-config.json");
  const localPath = path.join(__dirname, "runtime-config.json");
  return fs.existsSync(packagedPath) ? packagedPath : localPath;
}

function readRuntimeConfig() {
  try {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch {
    return null;
  }
}

function resolveAdminUrl() {
  if (!app.isPackaged) {
    return process.env.ELECTRON_START_URL || DEV_ADMIN_URL;
  }

  const config = readRuntimeConfig();
  return normalizeUrl(config?.adminAppUrl || "");
}

function buildErrorHtml(message) {
  return `<!doctype html>
  <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${APP_TITLE}</title>
      <style>
        body {
          margin: 0;
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #060606;
          color: #fff;
          font-family: "Segoe UI", Tahoma, sans-serif;
        }
        .card {
          width: min(560px, calc(100vw - 32px));
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 24px;
          padding: 32px;
          background: rgba(255, 255, 255, 0.03);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
        }
        h1 {
          margin: 0 0 12px;
          font-size: 28px;
        }
        p {
          margin: 0;
          line-height: 1.9;
          color: rgba(255, 255, 255, 0.8);
        }
      </style>
    </head>
    <body>
      <main class="card">
        <h1>تعذر فتح لوحة الإدارة</h1>
        <p>${message}</p>
      </main>
    </body>
  </html>`;
}

function createWindow() {
  const adminUrl = resolveAdminUrl();
  const window = new BrowserWindow({
    width: 1480,
    height: 980,
    minWidth: 1200,
    minHeight: 760,
    autoHideMenuBar: true,
    title: APP_TITLE,
    backgroundColor: "#050505",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);

  if (!adminUrl) {
    window.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(
        buildErrorHtml(
          "تأكد من توليد ملف إعدادات سطح المكتب عبر desktop:config بعد ضبط APP_BASE_URL أو ELECTRON_ADMIN_URL.",
        ),
      )}`,
    );
    return;
  }

  const adminOrigin = new URL(adminUrl).origin;

  window.webContents.setWindowOpenHandler(({ url }) => {
    try {
      if (new URL(url).origin === adminOrigin) {
        return { action: "allow" };
      }
    } catch {
      return { action: "deny" };
    }

    void shell.openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    try {
      if (new URL(url).origin !== adminOrigin) {
        event.preventDefault();
        void shell.openExternal(url);
      }
    } catch {
      event.preventDefault();
    }
  });

  window.webContents.on("did-fail-load", () => {
    window.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(
        buildErrorHtml(
          "تعذر الوصول إلى لوحة الإدارة المنشورة. تأكد أن الموقع يعمل وأن APP_BASE_URL يشير إلى الرابط العام الصحيح.",
        ),
      )}`,
    );
  });

  void window.loadURL(adminUrl);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

