import Papa from "papaparse";
import { createHash } from "crypto";
import { prisma } from "./db";

// Parse a Cronometer "Servings" CSV export and persist its rows. Cronometer
// has a stable schema for this export but the column set drifts over time
// as new nutrients are added, so we match headers tolerantly and stuff
// anything unrecognized into the `micros` JSON blob.

interface ParsedRow {
  date: Date;
  loggedAt: Date | null;
  foodName: string;
  amount: number | null;
  unit: string | null;
  category: string | null;
  energyKcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fiberG: number | null;
  sugarG: number | null;
  fatG: number | null;
  saturatedFatG: number | null;
  transFatG: number | null;
  cholesterolMg: number | null;
  sodiumMg: number | null;
  micros: Record<string, number>;
  rowHash: string;
}

// Match a header against a list of regex patterns. First match wins.
const HEADER_MATCHERS: Array<{ key: keyof Omit<ParsedRow, "micros" | "rowHash">; patterns: RegExp[] }> = [
  { key: "date", patterns: [/^day$/i, /^date$/i] },
  { key: "loggedAt", patterns: [/^time$/i] },
  { key: "category", patterns: [/^group$/i, /^meal/i, /^category$/i] },
  { key: "foodName", patterns: [/^food name$/i, /^food$/i, /^name$/i] },
  { key: "amount", patterns: [/^amount$/i, /^quantity$/i, /^serving size$/i] },
  { key: "unit", patterns: [/^unit/i, /^measure/i] },
  { key: "energyKcal", patterns: [/^energy/i, /\bkcal\b/i, /^calories$/i] },
  { key: "proteinG", patterns: [/^protein/i] },
  { key: "carbsG", patterns: [/^carbs/i, /^carbohydrate/i] },
  { key: "fiberG", patterns: [/^fib(re|er)/i] },
  { key: "sugarG", patterns: [/^sugars?\b/i] },
  { key: "saturatedFatG", patterns: [/^saturated/i, /^sat\.? fat/i] },
  { key: "transFatG", patterns: [/^trans/i] },
  { key: "cholesterolMg", patterns: [/^cholesterol/i] },
  { key: "sodiumMg", patterns: [/^sodium/i] },
  // Fat must come last among fat-like patterns so saturated/trans win first.
  { key: "fatG", patterns: [/^fat\b/i, /^total fat/i] },
];

interface HeaderMap {
  byKey: Partial<Record<keyof Omit<ParsedRow, "micros" | "rowHash">, number>>;
  byIndex: Map<number, keyof Omit<ParsedRow, "micros" | "rowHash">>;
}

function buildHeaderMap(headers: string[]): HeaderMap {
  const byKey: HeaderMap["byKey"] = {};
  const byIndex = new Map<number, keyof Omit<ParsedRow, "micros" | "rowHash">>();
  headers.forEach((rawHeader, index) => {
    const h = rawHeader.trim();
    for (const { key, patterns } of HEADER_MATCHERS) {
      if (byKey[key] !== undefined) continue;
      if (patterns.some((re) => re.test(h))) {
        byKey[key] = index;
        byIndex.set(index, key);
        break;
      }
    }
  });
  return { byKey, byIndex };
}

function parseNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  // Cronometer typically exports YYYY-MM-DD. Anchor at UTC midnight.
  const trimmed = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00.000Z`);
  }
  // Fallback: let Date attempt to parse (handles things like "May 9, 2026").
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function parseTime(dateStr: string | null, timeStr: string | null): Date | null {
  if (!dateStr || !timeStr) return null;
  // Cronometer time format: "HH:MM" or "HH:MM:SS" or "h:mm AM/PM".
  const datePart = parseDate(dateStr);
  if (!datePart) return null;
  const t = timeStr.trim();
  const m24 = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(t);
  if (m24) {
    const [, hh, mm, ss] = m24;
    return new Date(Date.UTC(
      datePart.getUTCFullYear(),
      datePart.getUTCMonth(),
      datePart.getUTCDate(),
      Number(hh),
      Number(mm),
      ss ? Number(ss) : 0
    ));
  }
  const m12 = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t);
  if (m12) {
    let hh = Number(m12[1]);
    const mm = Number(m12[2]);
    const ampm = m12[3].toUpperCase();
    if (ampm === "PM" && hh < 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;
    return new Date(Date.UTC(
      datePart.getUTCFullYear(),
      datePart.getUTCMonth(),
      datePart.getUTCDate(),
      hh,
      mm
    ));
  }
  return null;
}

export function parseCronometerCsv(csvText: string): ParsedRow[] {
  const result = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
  });
  if (result.errors.length > 0 && result.errors[0].code !== "TooFewFields") {
    // Some warnings are tolerable. Hard errors throw.
    const fatal = result.errors.find((e) => e.code === "MissingQuotes" || e.type === "Delimiter");
    if (fatal) throw new Error(`CSV parse error: ${fatal.message}`);
  }

  const rows = result.data;
  if (rows.length < 2) return [];

  const headers = rows[0].map((s) => (s ?? "").trim());
  const map = buildHeaderMap(headers);

  if (map.byKey.date === undefined || map.byKey.foodName === undefined) {
    throw new Error(
      "Couldn't find required columns in CSV. Expected at least a 'Day' (or 'Date') column and a 'Food Name' column. " +
        "Make sure you exported the 'Servings' CSV from Cronometer (Settings → Account → Export Data → Servings)."
    );
  }

  const parsed: ParsedRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => !c || !c.trim())) continue;

    const dateStr = row[map.byKey.date!] ?? "";
    const date = parseDate(dateStr);
    const foodName = (row[map.byKey.foodName!] ?? "").trim();
    if (!date || !foodName) continue;

    const timeStr = map.byKey.loggedAt !== undefined ? row[map.byKey.loggedAt] : null;
    const loggedAt = parseTime(dateStr, timeStr ?? null);

    const micros: Record<string, number> = {};
    for (let j = 0; j < row.length; j++) {
      if (map.byIndex.has(j)) continue;
      const header = headers[j];
      if (!header) continue;
      const val = parseNumber(row[j]);
      if (val !== null) micros[header] = val;
    }

    const get = (k: keyof Omit<ParsedRow, "micros" | "rowHash">) => {
      const idx = map.byKey[k];
      return idx !== undefined ? row[idx] : null;
    };

    const rowHash = createHash("sha256")
      .update(
        [
          date.toISOString(),
          loggedAt?.toISOString() ?? "",
          foodName,
          get("amount") ?? "",
          get("unit") ?? "",
          get("energyKcal") ?? "",
        ].join("|")
      )
      .digest("hex");

    parsed.push({
      date,
      loggedAt,
      foodName,
      amount: parseNumber(get("amount")),
      unit: typeof get("unit") === "string" ? (get("unit") as string).trim() || null : null,
      category: typeof get("category") === "string" ? (get("category") as string).trim() || null : null,
      energyKcal: parseNumber(get("energyKcal")),
      proteinG: parseNumber(get("proteinG")),
      carbsG: parseNumber(get("carbsG")),
      fiberG: parseNumber(get("fiberG")),
      sugarG: parseNumber(get("sugarG")),
      fatG: parseNumber(get("fatG")),
      saturatedFatG: parseNumber(get("saturatedFatG")),
      transFatG: parseNumber(get("transFatG")),
      cholesterolMg: parseNumber(get("cholesterolMg")),
      sodiumMg: parseNumber(get("sodiumMg")),
      micros,
      rowHash,
    });
  }
  return parsed;
}

export async function importCronometerCsv(csvText: string, filename: string | null) {
  const rows = parseCronometerCsv(csvText);
  if (rows.length === 0) {
    return { rowsImported: 0, rowsSkippedDuplicate: 0, batchId: null as string | null };
  }

  // Dedupe within the file itself (Cronometer can have exact duplicates if
  // you log the same food twice — those are real, but identical rows in the
  // same upload are noise).
  const uniq = new Map<string, ParsedRow>();
  for (const r of rows) uniq.set(r.rowHash, r);
  const dedupedRows = Array.from(uniq.values());

  // Skip rows already in the DB (re-importing the same CSV is a no-op).
  const existing = await prisma.nutritionEntry.findMany({
    where: { id: { in: [] } }, // dummy: we'll do a broader query below
  });
  void existing;
  const existingHashes = new Set<string>();
  // Look up by rowHash via a side table? We don't store rowHash. Instead,
  // re-derive uniqueness by (date, loggedAt, foodName, amount, unit) which
  // matches the hash inputs.
  const dateRange = {
    min: dedupedRows.reduce((min, r) => (r.date < min ? r.date : min), dedupedRows[0].date),
    max: dedupedRows.reduce((max, r) => (r.date > max ? r.date : max), dedupedRows[0].date),
  };
  const existingInRange = await prisma.nutritionEntry.findMany({
    where: { date: { gte: dateRange.min, lte: dateRange.max } },
    select: { date: true, loggedAt: true, foodName: true, amount: true, unit: true, energyKcal: true },
  });
  for (const e of existingInRange) {
    const h = createHash("sha256")
      .update(
        [
          e.date.toISOString(),
          e.loggedAt?.toISOString() ?? "",
          e.foodName,
          e.amount ?? "",
          e.unit ?? "",
          e.energyKcal ?? "",
        ].join("|")
      )
      .digest("hex");
    existingHashes.add(h);
  }

  const fresh = dedupedRows.filter((r) => !existingHashes.has(r.rowHash));

  const batch = await prisma.nutritionImport.create({
    data: {
      source: "cronometer",
      filename,
      rowsImported: fresh.length,
      startDate: dateRange.min,
      endDate: dateRange.max,
    },
  });

  if (fresh.length > 0) {
    // SQLite has a parameter limit — chunk inserts at 200 rows.
    const CHUNK = 200;
    for (let i = 0; i < fresh.length; i += CHUNK) {
      const slice = fresh.slice(i, i + CHUNK);
      await prisma.nutritionEntry.createMany({
        data: slice.map((r) => ({
          date: r.date,
          loggedAt: r.loggedAt,
          foodName: r.foodName,
          amount: r.amount,
          unit: r.unit,
          category: r.category,
          energyKcal: r.energyKcal,
          proteinG: r.proteinG,
          carbsG: r.carbsG,
          fiberG: r.fiberG,
          sugarG: r.sugarG,
          fatG: r.fatG,
          saturatedFatG: r.saturatedFatG,
          transFatG: r.transFatG,
          cholesterolMg: r.cholesterolMg,
          sodiumMg: r.sodiumMg,
          micros: Object.keys(r.micros).length > 0 ? JSON.stringify(r.micros) : null,
          importBatchId: batch.id,
        })),
      });
    }
  }

  return {
    rowsImported: fresh.length,
    rowsSkippedDuplicate: dedupedRows.length - fresh.length,
    totalRowsParsed: rows.length,
    batchId: batch.id,
  };
}
