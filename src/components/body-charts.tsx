"use client";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { format } from "date-fns";

interface Point {
  iso: string;
  weightKg?: number | null;
  bodyFatPct?: number | null;
  leanMassKg?: number | null;
  fatMassKg?: number | null;
}

const grid = { strokeDasharray: "3 3", stroke: "hsl(var(--border))" };
const axis = {
  tick: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
  stroke: "hsl(var(--border))",
};
const tooltip = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
  },
  labelFormatter: (v: string) => format(new Date(v), "PPP"),
};

export function WeightChart({ data }: { data: Point[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid {...grid} />
          <XAxis dataKey="iso" tickFormatter={(v) => format(new Date(v), "MMM d")} {...axis} />
          <YAxis {...axis} domain={["auto", "auto"]} />
          <Tooltip {...tooltip} formatter={(v: number) => v?.toFixed(1) + " kg"} />
          <Line
            type="monotone"
            dataKey="weightKg"
            name="Weight"
            stroke="hsl(var(--fitness))"
            strokeWidth={2}
            dot={{ r: 2 }}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BodyCompChart({ data }: { data: Point[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid {...grid} />
          <XAxis dataKey="iso" tickFormatter={(v) => format(new Date(v), "MMM d, yy")} {...axis} />
          <YAxis {...axis} domain={["auto", "auto"]} />
          <Tooltip {...tooltip} formatter={(v: number) => v?.toFixed(1)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="leanMassKg"
            name="Lean mass (kg)"
            stroke="hsl(var(--fitness))"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="fatMassKg"
            name="Fat mass (kg)"
            stroke="hsl(var(--finance-spend))"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="bodyFatPct"
            name="Body fat %"
            stroke="hsl(var(--fitness-accent))"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
