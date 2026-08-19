"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function BackupRestoreForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function downloadBackup() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/backup");
      if (!response.ok) throw new Error("Não foi possível criar o backup.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `investe-valor-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Backup baixado com sucesso.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível criar o backup.");
    } finally {
      setBusy(false);
    }
  }

  async function restore(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!window.confirm("A restauração substituirá todos os dados atuais e encerrará as sessões. Deseja continuar?")) {
      event.target.value = "";
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const content = await file.text();
      const response = await fetch("/api/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: content });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Não foi possível restaurar o backup.");
      setMessage(result.message);
      setTimeout(() => { router.push("/login"); router.refresh(); }, 700);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível restaurar o backup.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return <Card><CardHeader><CardTitle>Backup e restauração</CardTitle></CardHeader><CardContent className="flex flex-col gap-4"><p className="text-sm text-muted">Exporte investimentos, patrimônio, movimentos, configurações e contas de autenticação para um arquivo local.</p><div className="flex flex-wrap gap-2"><Button onClick={downloadBackup} disabled={busy}>Baixar backup</Button><Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>Restaurar backup</Button><input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={restore} /></div>{message && <p className="text-sm text-success">{message}</p>}{error && <p className="text-sm text-danger">{error}</p>}<p className="text-xs text-muted">Guarde o arquivo em local seguro. Ele contém dados criptografados do sistema e informações necessárias para restaurar sua conta.</p></CardContent></Card>;
}
