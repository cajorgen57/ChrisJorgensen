import { NextRequest, NextResponse } from "next/server";
import { syncItem, syncAllItems } from "@/lib/plaid-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const itemId = body?.item_id as string | undefined;
    if (itemId) {
      const r = await syncItem(itemId);
      return NextResponse.json(r);
    }
    const results = await syncAllItems();
    return NextResponse.json({ results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
