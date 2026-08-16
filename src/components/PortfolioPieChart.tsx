"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatBRL } from "@/lib/investment-calc";

type Slice = { type: string; label: string; value: number; color: string };

export function PortfolioPieChart({ data }: { data: Slice[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted">Sem dados para exibir.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={2}>
            {data.map((slice) => (
              <Cell key={slice.type} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatBRL(Number(value))} />
          <Legend verticalAlign="bottom" height={48} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
