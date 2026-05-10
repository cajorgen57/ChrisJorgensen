"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { format } from "date-fns";

interface DayPoint {
  iso: string;
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

const COMMON_GRID = { strokeDasharray: "3 3", stroke: "hsl(var(--border))" };

const COMMON_AXIS = {
  tick: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
  stroke: "hsl(var(--border))",
};

const COMMON_TOOLTIP = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
  },
};

export function CalorieLineChart({ data }: { data: DayPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid {...COMMON_GRID} />
          <XAxis
            dataKey="iso"
            tickFormatter={(v) => format(new Date(v), "MMM d")}
            {...COMMON_AXIS}
            interval="preserveStartEnd"
          />
          <YAxis {...COMMON_AXIS} />
          <Tooltip
            {...COMMON_TOOLTIP}
            labelFormatter={(v) => format(new Date(v), "PPP")}
            formatter={(v: number) => [Math.round(v) + " kcal", "Calories"]}
          />
          <Line
            type="monotone"
            dataKey="energyKcal"
            stroke="hsl(var(--fitness))"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MacrosBarChart({ data }: { data: DayPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid {...COMMON_GRID} />
          <XAxis
            dataKey="iso"
            tickFormatter={(v) => format(new Date(v), "MMM d")}
            {...COMMON_AXIS}
            interval="preserveStartEnd"
          />
          <YAxis {...COMMON_AXIS} />
          <Tooltip
            {...COMMON_TOOLTIP}
            labelFormatter={(v) => format(new Date(v), "PPP")}
            formatter={(v: number) => [Math.round(v) + " g"]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="proteinG" name="Protein" fill="hsl(var(--finance-income))" stackId="m" />
          <Bar dataKey="carbsG" name="Carbs" fill="hsl(var(--finance-invest))" stackId="m" />
          <Bar dataKey="fatG" name="Fat" fill="hsl(var(--finance-spend))" stackId="m" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
