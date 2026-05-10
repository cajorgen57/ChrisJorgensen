import { NextRequest, NextResponse } from "next/server";
import { removeItem } from "@/lib/plaid-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const itemId = body?.item_id as string | undefined;
    if (!itemId) {
      return NextResponse.json({ error: "item_id is required" }, { status: 400 });
    }
    await removeItem(itemId);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to remove item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
