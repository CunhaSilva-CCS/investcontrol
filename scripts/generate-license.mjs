#!/usr/bin/env node
// Vendor-only: mints a signed license key for a customer.
//
//   node scripts/generate-license.mjs --customer "Nome do Cliente" [--email cliente@exemplo.com] [--expires 2027-12-31]
//
// Requires vendor/license-private-key.pem (see scripts/generate-license-keypair.mjs).
// Prints the license key to stdout — send it to the customer; keep no other copy needed,
// since the key itself is self-contained (it embeds the customer name/email and expiration
// and can be re-verified offline by the app at any time).

import { createPrivateKey, sign as signPayload } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const privateKeyPath = path.join(root, "vendor", "license-private-key.pem");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key?.startsWith("--")) continue;
    args[key.slice(2)] = argv[i + 1];
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

if (!args.customer) {
  console.error("Uso: node scripts/generate-license.mjs --customer \"Nome\" [--email x@x.com] [--expires 2027-12-31]");
  process.exit(1);
}

if (!existsSync(privateKeyPath)) {
  console.error(
    `Chave privada não encontrada em ${privateKeyPath}.\n` +
      "Rode primeiro: node scripts/generate-license-keypair.mjs"
  );
  process.exit(1);
}

if (args.expires && Number.isNaN(Date.parse(args.expires))) {
  console.error(`Data de expiração inválida: "${args.expires}". Use o formato AAAA-MM-DD.`);
  process.exit(1);
}

const privateKey = createPrivateKey(readFileSync(privateKeyPath, "utf8"));

const payload = {
  customer: args.customer,
  email: args.email ?? undefined,
  product: "investe-valor",
  issuedAt: new Date().toISOString(),
  expiresAt: args.expires ? new Date(args.expires).toISOString() : null,
};

const payloadPart = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
const signature = signPayload(null, Buffer.from(payloadPart), privateKey);
const signaturePart = signature.toString("base64url");

const licenseKey = `IV1.${payloadPart}.${signaturePart}`;

console.log(licenseKey);
console.error(
  `\nLicença gerada para ${payload.customer}${payload.email ? ` <${payload.email}>` : ""}` +
    (payload.expiresAt ? `, expira em ${new Date(payload.expiresAt).toLocaleDateString("pt-BR")}` : ", sem expiração")
);
