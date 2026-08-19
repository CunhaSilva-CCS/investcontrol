#!/usr/bin/env node

import { randomBytes } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const licenseRoot = path.join(projectRoot, "..", "license-generator");
const generator = path.join(licenseRoot, "scripts", "generate-license.mjs");
const copyAssets = path.join(
  projectRoot,
  "scripts",
  "copy-standalone-assets.mjs",
);
const privateKeyPath = path.resolve(
  process.env.E2E_LICENSE_PRIVATE_KEY ||
    path.join(homedir(), "Documents", "investe-valor-license-private-key.pem"),
);
const tempDir = mkdtempSync(path.join(tmpdir(), "investe-valor-e2e-"));
const dbPath = path.join(tempDir, "e2e.db");
const licensePath = path.join(tempDir, "license.key");
const port = "3108";
const env = {
  ...process.env,
  DATABASE_URL: `file:${dbPath}`,
  ENCRYPTION_KEY: randomBytes(32).toString("base64"),
  LICENSE_FILE_PATH: licensePath,
  PORT: port,
  HOSTNAME: "127.0.0.1",
};

if (!existsSync(privateKeyPath)) {
  throw new Error(
    `Chave de teste não encontrada em ${privateKeyPath}. Defina E2E_LICENSE_PRIVATE_KEY com o caminho de uma chave correspondente à chave pública do app.`,
  );
}

function cleanup() {
  server?.kill("SIGTERM");
  rmSync(tempDir, { recursive: true, force: true });
}

const license = execFileSync(
  process.execPath,
  [
    generator,
    "--key",
    privateKeyPath,
    "--customer",
    "Teste E2E",
    "--email",
    "e2e@local.test",
    "--expires",
    "2099-12-31",
  ],
  { cwd: licenseRoot, env, encoding: "utf8" },
).trim();

if (!license.startsWith("IV1.")) {
  throw new Error("O gerador não retornou uma licença de teste válida.");
}

writeFileSync(licensePath, `${license}\n`, { mode: 0o600 });
execFileSync("npx", ["prisma", "migrate", "deploy"], {
  cwd: projectRoot,
  env,
  stdio: "inherit",
});
execFileSync(process.execPath, [copyAssets], {
  cwd: projectRoot,
  env,
  stdio: "inherit",
});

let server;
process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(143);
});

server = spawn(
  process.execPath,
  [path.join(projectRoot, ".next", "standalone", "server.js")],
  {
    cwd: projectRoot,
    env,
    stdio: "inherit",
  },
);

server.on("exit", (code, signal) => {
  cleanup();
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
