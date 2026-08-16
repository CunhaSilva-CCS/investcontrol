import { createPublicKey, verify as verifySignature } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { LICENSE_PUBLIC_KEY_PEM } from "@/lib/license-public-key";

const LICENSE_KEY_PREFIX = "IV1";
const LICENSE_FILE_PATH = path.join(process.cwd(), "license.key");

export type LicensePayload = {
  customer: string;
  email?: string;
  product: string;
  issuedAt: string;
  expiresAt: string | null;
};

export type LicenseCheck = { valid: true; payload: LicensePayload } | { valid: false; reason: string };

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

const publicKey = createPublicKey(LICENSE_PUBLIC_KEY_PEM);

/** Verifies a license key string's signature, format and expiration. Does not touch the filesystem. */
export function verifyLicenseKey(key: string): LicenseCheck {
  const trimmed = key.trim();
  const parts = trimmed.split(".");
  if (parts.length !== 3 || parts[0] !== LICENSE_KEY_PREFIX) {
    return { valid: false, reason: "Formato de chave de licença inválido." };
  }
  const [, payloadPart, signaturePart] = parts;

  let payload: LicensePayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadPart).toString("utf8"));
  } catch {
    return { valid: false, reason: "Não foi possível ler os dados da licença." };
  }

  const signatureValid = verifySignature(null, Buffer.from(payloadPart), publicKey, base64UrlDecode(signaturePart));
  if (!signatureValid) {
    return { valid: false, reason: "Assinatura da licença inválida." };
  }

  if (payload.expiresAt && new Date(payload.expiresAt).getTime() < Date.now()) {
    return { valid: false, reason: `Licença expirada em ${new Date(payload.expiresAt).toLocaleDateString("pt-BR")}.` };
  }

  return { valid: true, payload };
}

/** Reads and verifies the license key activated on this machine (license.key at the project root), if any. */
export function readActivatedLicense(): LicenseCheck {
  if (!existsSync(LICENSE_FILE_PATH)) {
    return { valid: false, reason: "Nenhuma licença ativada." };
  }
  const key = readFileSync(LICENSE_FILE_PATH, "utf8");
  return verifyLicenseKey(key);
}

/** Verifies and persists a license key as this machine's activation. */
export function activateLicense(key: string): LicenseCheck {
  const result = verifyLicenseKey(key);
  if (result.valid) {
    writeFileSync(LICENSE_FILE_PATH, key.trim(), { mode: 0o600 });
  }
  return result;
}

/** For Server Components: redirects to the activation screen when no valid license is active. */
export function requireLicense(): LicensePayload {
  const result = readActivatedLicense();
  if (!result.valid) {
    redirect("/ativacao");
  }
  return result.payload;
}

/** For Route Handlers: returns the active license payload, or null when unlicensed. */
export function getLicenseOrNull(): LicensePayload | null {
  const result = readActivatedLicense();
  return result.valid ? result.payload : null;
}

/** For Route Handlers: the 403 response to return when getLicenseOrNull() is null. */
export function licenseErrorResponse() {
  return NextResponse.json({ error: "Licença inválida ou não ativada." }, { status: 403 });
}
