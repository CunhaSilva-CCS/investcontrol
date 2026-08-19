"use strict";
// Electron main process. Only ever runs packaged (via electron-builder), never during plain
// `next dev`/`next start` — those keep working exactly as before. Responsibilities:
//   1. Point the app's config at a writable per-user data directory instead of the
//      (often read-only) install directory.
//   2. Create the SQLite database on first launch (see migrate.js).
//   3. Start the existing Next.js app as a local server and open a window pointing at it.
//
// process.resourcesPath only contains our extraResources (the standalone server + migrations)
// when the app has actually been packaged by electron-builder — see the "build" config in
// package.json.

const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const crypto = require("node:crypto");
const { app, BrowserWindow, dialog, safeStorage } = require("electron");
const { ensureDatabase } = require("./migrate");

const PORT = 17321;
const HOST = "127.0.0.1";
const ICON_PATH = path.join(__dirname, "..", "build", "icon.png");

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(start);

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

async function start() {
  try {
    prepareEnvironment();
    startServer();
    await waitForServer(`http://${HOST}:${PORT}/`);
    createWindow();
  } catch (err) {
    console.error("Falha ao iniciar o Investe Valor:", err);
    dialog.showErrorBox(
      "Não foi possível iniciar o Investe Valor",
      `${err.message || err}\n\n${err.stack || ""}`.trim(),
    );
    app.quit();
  }
}

function prepareEnvironment() {
  const userDataDir = app.getPath("userData");
  fs.mkdirSync(userDataDir, { recursive: true });

  const dbPath = path.join(userDataDir, "investe-valor.db");
  const keyPath = path.join(userDataDir, "encryption.key");
  const licensePath = path.join(userDataDir, "license.key");

  const encryptionKey = loadEncryptionKey(keyPath);

  process.env.NODE_ENV = "production";
  process.env.DATABASE_URL = `file:${dbPath}`;
  process.env.ENCRYPTION_KEY = encryptionKey;
  process.env.LICENSE_FILE_PATH = licensePath;
  process.env.PORT = String(PORT);
  process.env.HOSTNAME = HOST;

  const migrationsDir = path.join(process.resourcesPath, "migrations");
  const standaloneDir = path.join(process.resourcesPath, "standalone");
  ensureDatabase(dbPath, migrationsDir, standaloneDir);
}

function loadEncryptionKey(keyPath) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      "O armazenamento seguro do sistema operacional não está disponível para proteger a chave dos dados.",
    );
  }

  if (fs.existsSync(keyPath)) {
    const storedKey = fs.readFileSync(keyPath, "utf8").trim();

    if (storedKey.startsWith("safe-v1:")) {
      try {
        return safeStorage.decryptString(
          Buffer.from(storedKey.slice("safe-v1:".length), "base64"),
        );
      } catch (err) {
        throw new Error(
          `Não foi possível abrir a chave de criptografia protegida: ${err.message || err}`,
        );
      }
    }

    // Migrate keys created by older builds without changing the key itself.
    if (storedKey) {
      persistEncryptionKey(keyPath, storedKey);
      return storedKey;
    }
  }

  const encryptionKey = crypto.randomBytes(32).toString("base64");
  persistEncryptionKey(keyPath, encryptionKey);
  return encryptionKey;
}

function persistEncryptionKey(keyPath, encryptionKey) {
  const protectedKey = safeStorage
    .encryptString(encryptionKey)
    .toString("base64");
  fs.writeFileSync(keyPath, `safe-v1:${protectedKey}\n`, { mode: 0o600 });
  fs.chmodSync(keyPath, 0o600);
}

function startServer() {
  // Next's standalone server.js starts listening as a side effect of being required.
  require(path.join(process.resourcesPath, "standalone", "server.js"));
}

function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http
        .get(url, (res) => {
          res.resume();
          resolve();
        })
        .on("error", () => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error("O servidor local não respondeu a tempo."));
            return;
          }
          setTimeout(attempt, 200);
        });
    };
    attempt();
  });
}

function createWindow() {
  const appUrl = `http://${HOST}:${PORT}/`;
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 600,
    title: "Investe Valor",
    icon: ICON_PATH,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event, url) => {
    if (url !== appUrl) event.preventDefault();
  });
  win.loadURL(appUrl);
}
