import { spawn } from "node:child_process";
import process from "node:process";

const DEV_SERVER_URL = "http://127.0.0.1:3000/admin/login";
let nextProcess;
let electronProcess;

async function waitForServer(url, timeoutMs = 120000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) {
        return;
      }
    } catch {
      // Ignore and retry.
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function closeChildren() {
  if (electronProcess && !electronProcess.killed) {
    electronProcess.kill("SIGTERM");
  }

  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill("SIGTERM");
  }
}

process.on("SIGINT", () => {
  closeChildren();
  process.exit(0);
});

process.on("SIGTERM", () => {
  closeChildren();
  process.exit(0);
});

nextProcess = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

try {
  await waitForServer(DEV_SERVER_URL);

  electronProcess = spawn(
    "npx",
    ["electron", "."],
    {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: {
        ...process.env,
        ELECTRON_START_URL: DEV_SERVER_URL,
      },
    },
  );

  electronProcess.on("exit", (code) => {
    closeChildren();
    process.exit(code ?? 0);
  });
} catch (error) {
  closeChildren();
  console.error(error instanceof Error ? error.message : "Failed to launch Electron dev mode.");
  process.exit(1);
}
