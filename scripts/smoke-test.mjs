#!/usr/bin/env node

import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const tempDir = mkdtempSync(path.join(tmpdir(), "investe-valor-smoke-"));
const dbPath = path.join(tempDir, "smoke.db");
const licensePath = path.join(tempDir, "license.key");
const port = 3107;
const env = {
  ...process.env,
  DATABASE_URL: `file:${dbPath}`,
  ENCRYPTION_KEY: randomBytes(32).toString("base64"),
  LICENSE_FILE_PATH: licensePath,
};

let server;

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env,
    stdio: "inherit",
  });
  if (result.status !== 0)
    throw new Error(`${command} terminou com código ${result.status}`);
}

async function waitForServer(url) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status >= 200) return;
    } catch {
      // O servidor ainda está iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("O servidor não iniciou no tempo esperado.");
}

try {
  run("npx", ["prisma", "migrate", "deploy"]);
  server = spawn("npm", ["run", "start", "--", "-p", String(port)], {
    cwd: projectRoot,
    env,
    stdio: "ignore",
  });
  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForServer(`${baseUrl}/ativacao`);

  const activation = await fetch(`${baseUrl}/ativacao`);
  assert.equal(activation.status, 200);

  const home = await fetch(`${baseUrl}/`, { redirect: "manual" });
  assert.ok([307, 308].includes(home.status));
  assert.equal(home.headers.get("location"), "/ativacao");

  for (const page of [
    "/investimentos",
    "/patrimonio",
    "/dashboard",
    "/configuracoes",
  ]) {
    const response = await fetch(`${baseUrl}${page}`, { redirect: "manual" });
    assert.ok(
      [307, 308].includes(response.status),
      `${page} deveria exigir licença`,
    );
    assert.equal(response.headers.get("location"), "/ativacao");
  }

  for (const endpoint of [
    "/api/investments",
    "/api/portfolio?year=2026",
    "/api/settings",
  ]) {
    const response = await fetch(`${baseUrl}${endpoint}`);
    assert.equal(response.status, 403, `${endpoint} deveria exigir licença`);
  }

  console.log(
    "Smoke test concluído: inicialização, ativação e bloqueio das telas e APIs protegidas.",
  );
} finally {
  server?.kill("SIGTERM");
  if (existsSync(tempDir)) rmSync(tempDir, { recursive: true, force: true });
}
