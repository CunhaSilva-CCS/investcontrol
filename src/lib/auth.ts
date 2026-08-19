import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decrypt, encrypt } from "@/lib/crypto";
import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";
import nodemailer from "nodemailer";

const SESSION_COOKIE = "iv_session";
const SESSION_DAYS = 30;
const RESET_MINUTES = 30;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64, { N: 16_384, r: 8, p: 1 });
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

function verifyPassword(password: string, stored: string) {
  const [, salt, encoded] = stored.split("$");
  if (!salt || !encoded) return false;
  const expected = Buffer.from(encoded, "hex");
  const actual = scryptSync(password, salt, expected.length, { N: 16_384, r: 8, p: 1 });
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function setSessionCookie(token: string) {
  return cookies().then((store) => {
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    });
  });
}

export async function hasUsers() {
  return (await prisma.user.count()) > 0;
}

export async function createFirstUser(email: string, password: string) {
  if (await hasUsers()) throw new Error("Já existe uma conta cadastrada.");
  const user = await prisma.user.create({
    data: { email: normalizeEmail(email), passwordHash: hashPassword(password) },
  });
  await createSession(user.id);
  return user;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await prisma.authSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  await setSessionCookie(token);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.authSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.authSession.delete({ where: { id: session.id } });
    return null;
  }
  return session.user;
}

export async function logout() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.authSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  store.delete(SESSION_COOKIE);
}

export async function authenticate(email: string, password: string, totpCode?: string) {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  if (!user || !verifyPassword(password, user.passwordHash)) return { ok: false as const, reason: "E-mail ou senha inválidos." };
  if (user.totpEnabled) {
    if (!totpCode) return { ok: false as const, reason: "MFA_REQUIRED" };
    const result = await verify({ secret: decrypt(user.totpSecret ?? ""), token: totpCode.replace(/\s/g, "") });
    if (!result.valid) return { ok: false as const, reason: "Código do autenticador inválido." };
  }
  await createSession(user.id);
  return { ok: true as const, user };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function getAuthenticatedUserOrNull() {
  return getCurrentUser();
}

export async function createPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  if (!user) return;
  const token = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + RESET_MINUTES * 60 * 1000),
    },
  });

  const host = process.env.APP_URL ?? "http://localhost:3000";
  const resetUrl = `${host}/redefinir-senha?token=${encodeURIComponent(token)}`;
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) throw new Error("SMTP não configurado. Defina SMTP_HOST, SMTP_USER, SMTP_PASSWORD e SMTP_FROM.");
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: user.email,
    subject: "Redefinição de senha — Investe Valor",
    text: `Use este link para redefinir sua senha (válido por ${RESET_MINUTES} minutos): ${resetUrl}`,
  });
}

export async function resetPassword(token: string, password: string) {
  const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!reset || reset.usedAt || reset.expiresAt <= new Date()) throw new Error("Token inválido ou expirado.");
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: hashPassword(password) } }),
    prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    prisma.authSession.deleteMany({ where: { userId: reset.userId } }),
  ]);
}

export async function setupTotp(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const secret = generateSecret();
  const uri = generateURI({ issuer: "Investe Valor", label: user.email, secret });
  await prisma.user.update({ where: { id: userId }, data: { totpSecret: encrypt(secret), totpEnabled: false } });
  return { uri, qrCode: await QRCode.toDataURL(uri), secret };
}

export async function enableTotp(userId: string, code: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.totpSecret) throw new Error("Inicie a configuração do autenticador primeiro.");
  const result = await verify({ secret: decrypt(user.totpSecret), token: code.replace(/\s/g, "") });
  if (!result.valid) throw new Error("Código do autenticador inválido.");
  await prisma.user.update({ where: { id: userId }, data: { totpEnabled: true } });
}

export async function disableTotp(userId: string, code: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.totpEnabled || !user.totpSecret) return;
  const result = await verify({ secret: decrypt(user.totpSecret), token: code.replace(/\s/g, "") });
  if (!result.valid) throw new Error("Código do autenticador inválido.");
  await prisma.user.update({ where: { id: userId }, data: { totpEnabled: false, totpSecret: null } });
}

export async function getAuthStatus() {
  const user = await getCurrentUser();
  return { hasUser: await hasUsers(), user: user ? { email: user.email, totpEnabled: user.totpEnabled } : null };
}
