import { prisma } from "./db";

export interface DailyTotals {
  date: Date;
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

// Return one row per day in [from, to] (inclusive). Days with no logging
// are emitted with zeros so charts have continuous x-axis ticks.
export async function getDailyTotals(from: Date, to: Date): Promise<DailyTotals[]> {
  const entries = await prisma.nutritionEntry.findMany({
    where: { date: { gte: from, lte: to } },
    select: {
      date: true,
      energyKcal: true,
      proteinG: true,
      carbsG: true,
      fatG: true,
      fiberG: true,
    },
  });

  const byDay = new Map<string, DailyTotals>();
  for (const e of entries) {
    const k = e.date.toISOString().slice(0, 10);
    const cur = byDay.get(k) ?? {
      date: e.date,
      energyKcal: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
    };
    cur.energyKcal += e.energyKcal ?? 0;
    cur.proteinG += e.proteinG ?? 0;
    cur.carbsG += e.carbsG ?? 0;
    cur.fatG += e.fatG ?? 0;
    cur.fiberG += e.fiberG ?? 0;
    byDay.set(k, cur);
  }

  // Fill missing days with zeros.
  const out: DailyTotals[] = [];
  const cursor = new Date(from);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setUTCHours(0, 0, 0, 0);
  while (cursor <= end) {
    const k = cursor.toISOString().slice(0, 10);
    out.push(
      byDay.get(k) ?? {
        date: new Date(cursor),
        energyKcal: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
      }
    );
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export async function getRollingAverage(days: number): Promise<DailyTotals | null> {
  const to = new Date();
  to.setUTCHours(0, 0, 0, 0);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (days - 1));

  const totals = await getDailyTotals(from, to);
  // Only average days with non-zero calories — otherwise unlogged days drag
  // the average down spuriously.
  const logged = totals.filter((d) => d.energyKcal > 0);
  if (logged.length === 0) return null;
  const sum = logged.reduce(
    (acc, d) => ({
      date: d.date,
      energyKcal: acc.energyKcal + d.energyKcal,
      proteinG: acc.proteinG + d.proteinG,
      carbsG: acc.carbsG + d.carbsG,
      fatG: acc.fatG + d.fatG,
      fiberG: acc.fiberG + d.fiberG,
    }),
    { date: new Date(), energyKcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
  );
  return {
    date: new Date(),
    energyKcal: sum.energyKcal / logged.length,
    proteinG: sum.proteinG / logged.length,
    carbsG: sum.carbsG / logged.length,
    fatG: sum.fatG / logged.length,
    fiberG: sum.fiberG / logged.length,
  };
}

export async function getImportHistory() {
  return prisma.nutritionImport.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
