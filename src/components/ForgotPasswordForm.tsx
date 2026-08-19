"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const result = await response.json().catch(() => null);
    if (response.ok) setMessage(result.message);
    else setError(result?.error ?? "Não foi possível enviar o e-mail.");
  }

  return <form onSubmit={submit} className="flex flex-col gap-4"><div><Label htmlFor="forgot-email">E-mail da conta</Label><Input id="forgot-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>{message && <p className="text-sm text-success">{message}</p>}{error && <p className="text-sm text-danger">{error}</p>}<Button type="submit">Enviar instruções</Button><Link href="/login" className="text-sm text-primary hover:underline text-center">Voltar para o login</Link></form>;
}
