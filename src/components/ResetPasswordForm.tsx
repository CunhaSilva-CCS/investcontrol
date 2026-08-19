"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmation) { setError("As senhas não conferem."); return; }
    const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    const result = await response.json().catch(() => null);
    if (response.ok) router.push("/login");
    else setError(result?.error ?? "Não foi possível redefinir a senha.");
  }

  return <form onSubmit={submit} className="flex flex-col gap-4"><div><Label htmlFor="reset-password">Nova senha</Label><Input id="reset-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></div><div><Label htmlFor="reset-confirmation">Confirmar nova senha</Label><Input id="reset-confirmation" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>{error && <p className="text-sm text-danger">{error}</p>}<Button type="submit">Redefinir senha</Button></form>;
}
