"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/Button";
import { projectValue, formatBRL, isTaxExempt, type RatesSettings } from "@/lib/investment-calc";
import { INVESTMENT_TYPE_LABELS, formatRate } from "@/lib/labels";
import type { InvestmentDTO } from "@/lib/types";

export function InvestmentsTable({
  investments,
  rates,
  onEdit,
  onDelete,
}: {
  investments: InvestmentDTO[];
  rates: RatesSettings;
  onEdit: (inv: InvestmentDTO) => void;
  onDelete: (inv: InvestmentDTO) => void;
}) {
  if (investments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">
        Nenhum investimento cadastrado ainda.
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="rounded-xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-muted text-left text-xs text-muted">
            <th className="px-4 py-3 font-medium">Investimento</th>
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">Taxa</th>
            <th className="px-4 py-3 font-medium text-right">Investido</th>
            <th className="px-4 py-3 font-medium text-right">Estimado hoje</th>
            <th className="px-4 py-3 font-medium">Vencimento</th>
            <th className="px-4 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {investments.map((inv) => {
            const proj = projectValue(
              {
                type: inv.type,
                indexType: inv.indexType,
                rate: inv.rate,
                principal: inv.principal,
                applicationDate: new Date(inv.applicationDate),
                maturityDate: inv.maturityDate ? new Date(inv.maturityDate) : null,
              },
              rates,
              now
            );
            const exempt = isTaxExempt(inv.type);

            return (
              <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-surface-muted/50">
                <td className="px-4 py-3">
                  <p className="font-medium">{inv.name}</p>
                  <p className="text-xs text-muted">{inv.institution}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{INVESTMENT_TYPE_LABELS[inv.type]}</p>
                  {exempt && <p className="text-xs text-success">Isento de IR</p>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatRate(inv.indexType, inv.rate)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{formatBRL(inv.principal)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <p className="font-medium">{formatBRL(proj.netValue)}</p>
                  <p className={`text-xs ${proj.netGain >= 0 ? "text-success" : "text-danger"}`}>
                    {proj.netGain >= 0 ? "+" : ""}
                    {formatBRL(proj.netGain)}
                  </p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {inv.maturityDate ? format(new Date(inv.maturityDate), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(inv)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => onDelete(inv)}>
                      Excluir
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
