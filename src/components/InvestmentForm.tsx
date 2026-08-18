"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Label, Input, Select } from "@/components/ui/Field";
import type { InvestmentDTO } from "@/lib/types";
import type { Currency, IndexType, InvestmentType, Liquidity } from "@/generated/prisma/client";
import { INDEX_TYPE_LABELS, INVESTMENT_TYPE_LABELS, LIQUIDITY_LABELS, DEFAULT_RATE_SUFFIX } from "@/lib/labels";

const DEFAULT_INDEX_BY_TYPE: Record<InvestmentType, IndexType> = {
  CDB: "CDI",
  LCI: "CDI",
  LCA: "CDI",
  LC: "CDI",
  TESOURO_SELIC: "SELIC",
  TESOURO_PREFIXADO: "PREFIXADO",
  TESOURO_IPCA: "IPCA",
  POUPANCA: "PREFIXADO",
  OUTRO: "CDI",
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function InvestmentForm({
  investment,
  onSaved,
  onCancel,
}: {
  investment: InvestmentDTO | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(investment?.name ?? "");
  const [institution, setInstitution] = useState(investment?.institution ?? "");
  const [type, setType] = useState<InvestmentType>(investment?.type ?? "CDB");
  const [currency, setCurrency] = useState<Currency>(investment?.currency ?? "BRL");
  const [indexType, setIndexType] = useState<IndexType>(investment?.indexType ?? "CDI");
  const [rate, setRate] = useState(investment ? String(investment.rate) : "100");
  const [principal, setPrincipal] = useState(investment ? String(investment.principal) : "");
  const [applicationDate, setApplicationDate] = useState(
    toDateInputValue(investment?.applicationDate ?? new Date().toISOString())
  );
  const [maturityDate, setMaturityDate] = useState(toDateInputValue(investment?.maturityDate ?? null));
  const [liquidity, setLiquidity] = useState<Liquidity>(investment?.liquidity ?? "NO_VENCIMENTO");
  const [fgcCovered, setFgcCovered] = useState(investment?.fgcCovered ?? true);
  const [notes, setNotes] = useState(investment?.notes ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTypeChange(newType: InvestmentType) {
    setType(newType);
    if (!investment) {
      setIndexType(DEFAULT_INDEX_BY_TYPE[newType]);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      name,
      institution,
      type,
      currency,
      indexType,
      rate: Number(rate),
      principal: Number(principal),
      applicationDate,
      maturityDate: maturityDate || null,
      liquidity,
      fgcCovered,
      notes: notes || null,
    };

    try {
      const url = investment ? `/api/investments/${investment.id}` : "/api/investments";
      const method = investment ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const fieldErrors = body?.error?.fieldErrors ?? {};
        const messages = [...(body?.error?.formErrors ?? []), ...Object.values(fieldErrors).flat()];
        throw new Error(messages.join(", ") || "Não foi possível salvar o investimento.");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label htmlFor="name">Nome / apelido</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: CDB liquidez diária" />
        </div>
        <div className="col-span-2">
          <Label htmlFor="institution">Instituição</Label>
          <Input id="institution" required value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Ex: Banco XP" />
        </div>

        <div>
          <Label htmlFor="type">Tipo</Label>
          <Select id="type" value={type} onChange={(e) => handleTypeChange(e.target.value as InvestmentType)}>
            {Object.entries(INVESTMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="indexType">Indexador</Label>
          <Select id="indexType" value={indexType} onChange={(e) => setIndexType(e.target.value as IndexType)}>
            {Object.entries(INDEX_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="currency">Moeda</Label>
          <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
            <option value="BRL">Real (BRL)</option>
            <option value="USD">Dólar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="rate">Taxa ({DEFAULT_RATE_SUFFIX[indexType]})</Label>
          <Input
            id="rate"
            type="number"
            step="0.01"
            min="0"
            required
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        <div>
            <Label htmlFor="principal">Valor investido em {currency}</Label>
          <Input
            id="principal"
            type="number"
            step="0.01"
            min="0"
            required
            value={principal}
            placeholder={`0,00 ${currency}`}
            onChange={(e) => setPrincipal(e.target.value)}
          />
          <p className="text-[11px] text-muted mt-1">Informe o valor na moeda selecionada acima.</p>
        </div>

        <div>
          <Label htmlFor="applicationDate">Data de aplicação</Label>
          <Input
            id="applicationDate"
            type="date"
            required
            value={applicationDate}
            onChange={(e) => setApplicationDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="maturityDate">Data de vencimento</Label>
          <Input
            id="maturityDate"
            type="date"
            value={maturityDate}
            onChange={(e) => setMaturityDate(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="liquidity">Liquidez</Label>
          <Select id="liquidity" value={liquidity} onChange={(e) => setLiquidity(e.target.value as Liquidity)}>
            {Object.entries(LIQUIDITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={fgcCovered} onChange={(e) => setFgcCovered(e.target.checked)} />
            Coberto pelo FGC
          </label>
        </div>

        <div className="col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <textarea
            id="notes"
            value={notes ?? ""}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : investment ? "Salvar alterações" : "Adicionar"}
        </Button>
      </div>
    </form>
  );
}
