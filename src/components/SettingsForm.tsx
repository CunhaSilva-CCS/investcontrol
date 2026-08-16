"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Label, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { RatesSettings } from "@/lib/investment-calc";

export function SettingsForm({ settings }: { settings: RatesSettings }) {
  const router = useRouter();
  const [cdiRate, setCdiRate] = useState(String(settings.cdiRate));
  const [selicRate, setSelicRate] = useState(String(settings.selicRate));
  const [ipcaRate, setIpcaRate] = useState(String(settings.ipcaRate));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cdiRate: Number(cdiRate),
          selicRate: Number(selicRate),
          ipcaRate: Number(ipcaRate),
        }),
      });
      if (!res.ok) throw new Error("Não foi possível salvar as configurações.");
      setMessage("Configurações salvas com sucesso.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="cdiRate">Taxa CDI atual (% a.a.)</Label>
            <Input id="cdiRate" type="number" step="0.01" min="0" required value={cdiRate} onChange={(e) => setCdiRate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="selicRate">Taxa Selic atual (% a.a.)</Label>
            <Input id="selicRate" type="number" step="0.01" min="0" required value={selicRate} onChange={(e) => setSelicRate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ipcaRate">IPCA projetado (% a.a.)</Label>
            <Input id="ipcaRate" type="number" step="0.01" min="0" required value={ipcaRate} onChange={(e) => setIpcaRate(e.target.value)} />
          </div>

          {message && <p className="text-sm text-success">{message}</p>}
          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
