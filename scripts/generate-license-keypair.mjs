#!/usr/bin/env node
// Vendor-only, one-time setup: generates the Ed25519 keypair used to sign and verify
// license keys. Run this once when setting up the product for sale.
//
//   node scripts/generate-license-keypair.mjs
//
// Writes:
//   vendor/license-private-key.pem   — KEEP SECRET. Never commit, never ship to customers.
//                                       Used by scripts/generate-license.mjs to sign new licenses.
//   src/lib/license-public-key.ts    — safe to commit. Ships with the app; used to verify keys.
//
// Regenerating the keypair invalidates every license key issued so far, since old keys
// were signed with the old private key. Refuses to overwrite an existing private key
// unless --force is passed.

import { generateKeyPairSync } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const privateKeyPath = path.join(root, "vendor", "license-private-key.pem");
const publicKeyModulePath = path.join(root, "src", "lib", "license-public-key.ts");

const force = process.argv.includes("--force");

if (existsSync(privateKeyPath) && !force) {
  console.error(
    `Já existe uma chave privada em ${privateKeyPath}.\n` +
      "Regenerar o par de chaves invalida todas as licenças já emitidas.\n" +
      "Rode com --force se tiver certeza que quer substituir."
  );
  process.exit(1);
}

const { publicKey, privateKey } = generateKeyPairSync("ed25519");

const privatePem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const publicPem = publicKey.export({ type: "spki", format: "pem" }).toString();

mkdirSync(path.dirname(privateKeyPath), { recursive: true });
writeFileSync(privateKeyPath, privatePem, { mode: 0o600 });

const moduleSource = `// Gerado por scripts/generate-license-keypair.mjs — não editar manualmente.
// Chave pública Ed25519 usada para validar chaves de licença. Seguro para versionar:
// só permite VERIFICAR licenças assinadas, não criar novas.
export const LICENSE_PUBLIC_KEY_PEM = \`${publicPem.trim()}\`;
`;
writeFileSync(publicKeyModulePath, moduleSource);

console.log("Par de chaves gerado com sucesso.");
console.log(`  Privada: ${privateKeyPath} (NÃO compartilhe, NÃO commite)`);
console.log(`  Pública: ${publicKeyModulePath} (já pode ser commitada)`);
console.log("\nGuarde a chave privada em um lugar seguro (cofre de senhas, backup criptografado).");
console.log("Se ela vazar, qualquer pessoa poderá gerar licenças válidas. Se for perdida, você");
console.log("não conseguirá mais emitir licenças novas sem invalidar as já vendidas.");
