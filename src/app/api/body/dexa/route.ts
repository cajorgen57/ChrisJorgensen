import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PDF reports live under uploads/dexa/, gitignored.
const UPLOAD_DIR = join(process.cwd(), "uploads", "dexa");
const MAX_BYTES = 25 * 1024 * 1024;

function num(form: FormData, key: string): number | null {
  const v = form.get(key);
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(form: FormData, key: string): string | null {
  const v = form.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.trim();
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const dateRaw = str(form, "scanDate");
    if (!dateRaw) return NextResponse.json({ error: "scanDate required" }, { status: 400 });
    const scanDate = new Date(`${dateRaw}T00:00:00.000Z`);
    if (isNaN(scanDate.getTime())) {
      return NextResponse.json({ error: "Invalid scanDate" }, { status: 400 });
    }

    let reportFilePath: string | null = null;
    const file = form.get("report");
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: "Report file too large (max 25MB)" }, { status: 413 });
      }
      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
      }
      const ext = file.name.toLowerCase().endsWith(".pdf") ? ".pdf" : "";
      const filename = `${dateRaw}_${randomUUID()}${ext}`;
      const fullPath = join(UPLOAD_DIR, filename);
      const buf = Buffer.from(await file.arrayBuffer());
      await writeFile(fullPath, buf);
      reportFilePath = `uploads/dexa/${filename}`;
    }

    const created = await prisma.dexaScan.create({
      data: {
        scanDate,
        provider: str(form, "provider"),
        totalMassKg: num(form, "totalMassKg"),
        leanMassKg: num(form, "leanMassKg"),
        fatMassKg: num(form, "fatMassKg"),
        bodyFatPct: num(form, "bodyFatPct"),
        vatMassG: num(form, "vatMassG"),
        bmcKg: num(form, "bmcKg"),
        bmdGcm2: num(form, "bmdGcm2"),
        androidFatPct: num(form, "androidFatPct"),
        gynoidFatPct: num(form, "gynoidFatPct"),
        agRatio: num(form, "agRatio"),
        notes: str(form, "notes"),
        reportFilePath,
      },
    });
    return NextResponse.json(created);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save scan" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await prisma.dexaScan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}
