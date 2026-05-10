import { NextResponse } from "next/server";
import { regenerateTlhCandidates } from "@/lib/tlh-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await regenerateTlhCandidates();
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to regenerate TLH candidates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
