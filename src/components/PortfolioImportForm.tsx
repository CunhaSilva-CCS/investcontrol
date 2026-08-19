"use client";

import { useState, type ChangeEvent } from "react";
import { Card, CardContent } from "@/components/ui/Card";

export function PortfolioImportForm() {
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function importWorkbook(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/portfolio/import", { method: "POST", body: form });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error ?? "Não foi possível importar a planilha.");
      } else {
        setMessage(`${result.imported} valores importados das abas ${(result.years ?? []).join(", ")}.`);
      }
    } catch {
      setError("Não foi possível importar a planilha.");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  return (
    <Card>
      <CardContent className="pt-5 flex flex-col gap-3">
        <div>
          <p className="font-medium">Importar planilha de patrimônio</p>
          <p className="text-xs text-muted mt-1">Importa as abas anuais do arquivo Excel e mantém os dados já cadastrados.</p>
        </div>
        <label className="inline-flex w-fit items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium cursor-pointer">
          {importing ? "Importando..." : "Selecionar .xlsx"}
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={importWorkbook} disabled={importing} />
        </label>
        {message && <p className="text-sm text-success">{message}</p>}
        {error && <p className="text-sm text-danger">{error}</p>}
      </CardContent>
    </Card>
  );
}
