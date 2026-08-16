#!/usr/bin/env node
// One-command setup for a fresh install of Investe Valor.
//
//   npm run setup
//
// Creates .env (with a freshly generated ENCRYPTION_KEY) if one doesn't exist yet,
// installs dependencies, applies database migrations, and builds the app for production.
// Safe to re-run: it never overwrites an existing .env, so re-running after an update
// won't touch your encryption key or your data.

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envPath = path.join(root, ".env");
const envExamplePath = path.join(root, ".env.example");

function step(label, fn) {
  console.log(`\n▶ ${label}`);
  fn();
}

function run(command) {
  execSync(command, { cwd: root, stdio: "inherit" });
}

const [major] = process.versions.node.split(".").map(Number);
if (major < 20) {
  console.error(`Node.js 20+ é necessário (detectado: ${process.versions.node}). Atualize o Node.js e rode de novo.`);
  process.exit(1);
}

if (existsSync(envPath)) {
  console.log("✓ .env já existe — mantendo como está (nenhuma chave foi alterada).");
} else {
  step("Criando .env com uma chave de criptografia nova", () => {
    const example = readFileSync(envExamplePath, "utf8");
    const key = randomBytes(32).toString("base64");
    const content = example.replace('ENCRYPTION_KEY=""', `ENCRYPTION_KEY="${key}"`);
    writeFileSync(envPath, content, { mode: 0o600 });
    console.log("✓ .env criado.");
  });
}

step("Instalando dependências (npm install)", () => run("npm install"));
step("Aplicando migrations do banco de dados", () => run("npx prisma migrate deploy"));
step("Gerando build de produção", () => run("npm run build"));

console.log(`
Tudo pronto. Para iniciar:

  npm run start

Depois abra http://localhost:3000 — na primeira vez, a tela vai pedir a chave de
licença que você recebeu na compra.
`);
