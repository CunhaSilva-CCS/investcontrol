"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmation) { setError("As senhas não conferem."); return; }
    setBusy(true);
    setError(null);
    const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const result = await response.json().catch(() => null);
    if (response.ok) router.push("/");
    else setError(result?.error ?? "Não foi possível criar a conta.");
    setBusy(false);
  }

  return <form onSubmit={submit} className="flex flex-col gap-4"><div><Label htmlFor="register-email">E-mail</Label><Input id="register-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div><div><Label htmlFor="register-password">Senha</Label><Input id="register-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /><p className="text-xs text-muted mt-1">Use pelo menos 8 caracteres.</p></div><div><Label htmlFor="register-confirmation">Confirmar senha</Label><Input id="register-confirmation" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>{error && <p className="text-sm text-danger">{error}</p>}<Button type="submit" disabled={busy}>{busy ? "Criando..." : "Criar conta"}</Button><Link href="/login" className="text-sm text-primary hover:underline text-center">Já tenho uma conta</Link></form>;
}
