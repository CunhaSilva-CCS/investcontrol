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
  const [usdToBrl, setUsdToBrl] = useState(String(settings.usdToBrl));
  const [eurToBrl, setEurToBrl] = useState(String(settings.eurToBrl));
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
          usdToBrl: Number(usdToBrl),
          eurToBrl: Number(eurToBrl),
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
          <div className="border-t border-border pt-4 mt-1">
            <p className="text-sm font-semibold">Fatores de conversão</p>
            <p className="text-xs text-muted mt-1 mb-3">O Dashboard usa estes fatores para converter USD e EUR para BRL.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="usdToBrl">1 USD vale (BRL)</Label>
                <Input id="usdToBrl" type="number" step="0.0001" min="0.0001" required value={usdToBrl} onChange={(e) => setUsdToBrl(e.target.value)} placeholder="Ex.: 5,50" />
              </div>
              <div>
                <Label htmlFor="eurToBrl">1 EUR vale (BRL)</Label>
                <Input id="eurToBrl" type="number" step="0.0001" min="0.0001" required value={eurToBrl} onChange={(e) => setEurToBrl(e.target.value)} placeholder="Ex.: 6,20" />
              </div>
            </div>
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
