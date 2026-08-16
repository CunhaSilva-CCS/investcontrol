import Link from "next/link";
import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { INVESTMENT_TYPE_LABELS } from "@/lib/labels";
import type { InvestmentType } from "@/generated/prisma/client";

type Item = {
  id: string;
  name: string;
  institution: string;
  type: InvestmentType;
  maturityDate: string;
};

export function MaturityList({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">Nenhum vencimento nos próximos 90 dias.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((item) => {
        const date = new Date(item.maturityDate);
        const days = differenceInCalendarDays(date, new Date());
        return (
          <li key={item.id} className="py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Link href="/investimentos" className="font-medium hover:text-primary truncate block">
                {item.name}
              </Link>
              <p className="text-xs text-muted truncate">
                {item.institution} · {INVESTMENT_TYPE_LABELS[item.type]}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-medium">{format(date, "dd/MM/yyyy", { locale: ptBR })}</p>
              <p className="text-xs text-muted">{days === 0 ? "hoje" : `em ${days} dia${days === 1 ? "" : "s"}`}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
