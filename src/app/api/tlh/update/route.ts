import { NextRequest, NextResponse } from "next/server";
import { updateTlhCandidate } from "@/lib/tlh-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body?.id as string | undefined;
    const status = body?.status as "open" | "dismissed" | "acted" | undefined;
    if (!id || !status || !["open", "dismissed", "acted"].includes(status)) {
      return NextResponse.json({ error: "id and valid status are required" }, { status: 400 });
    }
    await updateTlhCandidate(id, status);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update candidate";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
