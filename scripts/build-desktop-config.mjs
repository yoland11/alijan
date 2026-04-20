import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const envFiles = [".env.local", ".env.production", ".env"];

function parseEnvFile(filePath) {
  const env = {};
  const contents = fs.readFileSync(filePath, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [rawKey, ...rawValue] = trimmed.split("=");
    const key = rawKey.trim();
    const value = rawValue.join("=").trim().replace(/^["']|["']$/g, "");
    env[key] = value;
  }

  return env;
}

function loadEnv() {
  const merged = {};

  for (const file of envFiles) {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      Object.assign(merged, parseEnvFile(filePath));
    }
  }

  return merged;
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

const env = {
  ...loadEnv(),
  ...process.env,
};

const directAdminUrl = env.ELECTRON_ADMIN_URL?.trim();
const baseUrl = env.APP_BASE_URL?.trim() || env.NEXT_PUBLIC_APP_URL?.trim();

let adminAppUrl;
let trackingAppUrl;

if (directAdminUrl) {
  const parsed = new URL(directAdminUrl);
  adminAppUrl = parsed.toString();
  trackingAppUrl = `${parsed.origin}/track`;
} else if (baseUrl) {
  const normalizedBaseUrl = stripTrailingSlash(baseUrl);
  adminAppUrl = `${normalizedBaseUrl}/admin/login`;
  trackingAppUrl = `${normalizedBaseUrl}/track`;
} else {
  throw new Error(
    "Missing APP_BASE_URL, NEXT_PUBLIC_APP_URL, or ELECTRON_ADMIN_URL. Set one of them before building the desktop app.",
  );
}

const runtimeConfigPath = path.join(projectRoot, "electron", "runtime-config.json");

fs.writeFileSync(
  runtimeConfigPath,
  JSON.stringify(
    {
      adminAppUrl,
      trackingAppUrl,
    },
    null,
    2,
  ),
);

console.log(`Desktop runtime config written to ${runtimeConfigPath}`);

