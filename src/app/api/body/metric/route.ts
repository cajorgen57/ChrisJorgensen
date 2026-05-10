import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  date: z.string(), // YYYY-MM-DD
  weightKg: z.number().nullable().optional(),
  bodyFatPct: z.number().nullable().optional(),
  waistCm: z.number().nullable().optional(),
  restingHrBpm: z.number().int().nullable().optional(),
  hrvMs: z.number().nullable().optional(),
  sleepHours: z.number().nullable().optional(),
  steps: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = Schema.parse(body);
    const date = new Date(`${data.date}T00:00:00.000Z`);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const upserted = await prisma.bodyMetric.upsert({
      where: { date },
      create: {
        date,
        weightKg: data.weightKg ?? null,
        bodyFatPct: data.bodyFatPct ?? null,
        waistCm: data.waistCm ?? null,
        restingHrBpm: data.restingHrBpm ?? null,
        hrvMs: data.hrvMs ?? null,
        sleepHours: data.sleepHours ?? null,
        steps: data.steps ?? null,
        notes: data.notes ?? null,
      },
      update: {
        weightKg: data.weightKg ?? null,
        bodyFatPct: data.bodyFatPct ?? null,
        waistCm: data.waistCm ?? null,
        restingHrBpm: data.restingHrBpm ?? null,
        hrvMs: data.hrvMs ?? null,
        sleepHours: data.sleepHours ?? null,
        steps: data.steps ?? null,
        notes: data.notes ?? null,
      },
    });
    return NextResponse.json(upserted);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save metric" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await prisma.bodyMetric.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}
