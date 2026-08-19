"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

export function SecurityForm({ totpEnabled }: { totpEnabled: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(totpEnabled);
  const [setup, setSetup] = useState<{ qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startSetup() {
    setError(null);
    const response = await fetch("/api/auth/totp/setup");
    const result = await response.json();
    if (!response.ok) setError(result.error ?? "Não foi possível iniciar o autenticador.");
    else setSetup(result);
  }

  async function confirmSetup() {
    const response = await fetch("/api/auth/totp/enable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const result = await response.json();
    if (!response.ok) setError(result.error ?? "Código inválido.");
    else { setEnabled(true); setSetup(null); setCode(""); setMessage("Autenticador ativado com sucesso."); router.refresh(); }
  }

  async function disable() {
    const response = await fetch("/api/auth/totp/disable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const result = await response.json();
    if (!response.ok) setError(result.error ?? "Código inválido.");
    else { setEnabled(false); setCode(""); setMessage("Autenticador desativado."); router.refresh(); }
  }

  return <div className="flex flex-col gap-4"><div><p className="font-medium">Autenticador externo</p><p className="text-sm text-muted mt-1">Use Google Authenticator, Authy, Microsoft Authenticator ou outro app compatível com TOTP.</p></div>{!enabled && !setup && <Button onClick={startSetup}>Configurar autenticador</Button>}{setup && <div className="flex flex-col gap-3"><p className="text-sm">Escaneie o QR Code no aplicativo autenticador. Se necessário, use a chave manual abaixo.</p><Image src={setup.qrCode} alt="QR Code para configurar o autenticador" width={192} height={192} unoptimized className="border border-border p-2 bg-white" /><code className="text-xs break-all bg-surface-muted p-2 rounded">{setup.secret}</code><div><Label htmlFor="totp-setup-code">Código exibido no aplicativo</Label><Input id="totp-setup-code" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} /></div><Button onClick={confirmSetup}>Confirmar ativação</Button></div>}{enabled && <><p className="text-sm text-success">Autenticador ativado.</p><div><Label htmlFor="totp-disable-code">Código atual para desativar</Label><Input id="totp-disable-code" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} /></div><Button variant="danger" onClick={disable}>Desativar autenticador</Button></>}{message && <p className="text-sm text-success">{message}</p>}{error && <p className="text-sm text-danger">{error}</p>}</div>;
}
