import { NextRequest, NextResponse } from "next/server";
import { importCronometerCsv } from "@/lib/nutrition-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 25 MB cap. A multi-year Cronometer Servings export is typically a few MB.
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB)` },
        { status: 413 }
      );
    }
    const text = await file.text();
    const result = await importCronometerCsv(text, file.name);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
