"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface Slice {
  name: string;
  value: number;
  pct: number;
}

const COLORS = [
  "hsl(217 91% 60%)", // invest
  "hsl(160 65% 55%)", // fitness
  "hsl(280 70% 70%)", // fitness-accent
  "hsl(45 93% 58%)",
  "hsl(12 76% 56%)",
  "hsl(195 70% 55%)",
  "hsl(110 50% 55%)",
];

export function AllocationChart({ data }: { data: Slice[] }) {
  if (data.length === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={45} outerRadius={85} paddingAngle={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => formatCurrency(v)}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2">
        {data.map((s, i) => (
          <li key={s.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="truncate">{s.name}</span>
            </div>
            <div className="flex items-center gap-3 number">
              <span className="text-muted-foreground text-xs">{(s.pct * 100).toFixed(1)}%</span>
              <span className="font-medium tabular-nums">{formatCurrency(s.value)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
