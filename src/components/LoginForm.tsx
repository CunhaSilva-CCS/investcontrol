"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, totpCode: totpCode || undefined }),
    });
    const result = await response.json().catch(() => null);
    if (response.ok) router.push("/");
    else if (result?.error === "MFA_REQUIRED") setNeedsTotp(true);
    else setError(result?.error ?? "Não foi possível entrar.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div><Label htmlFor="login-email">E-mail</Label><Input id="login-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
      <div><Label htmlFor="login-password">Senha</Label><Input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
      {needsTotp && <div><Label htmlFor="login-totp">Código do autenticador</Label><Input id="login-totp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={totpCode} onChange={(event) => setTotpCode(event.target.value)} /><p className="text-xs text-muted mt-1">Informe o código de 6 dígitos do Google Authenticator ou outro app compatível.</p></div>}
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={busy}>{busy ? "Entrando..." : "Entrar"}</Button>
      <div className="flex justify-between text-sm"><Link href="/recuperar-senha" className="text-primary hover:underline">Esqueci minha senha</Link><Link href="/cadastro" className="text-primary hover:underline">Criar conta</Link></div>
    </form>
  );
}
