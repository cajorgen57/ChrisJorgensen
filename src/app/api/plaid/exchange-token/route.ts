import { NextRequest, NextResponse } from "next/server";
import { exchangeAndInit } from "@/lib/plaid-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const publicToken = body?.public_token;
    if (typeof publicToken !== "string" || !publicToken) {
      return NextResponse.json({ error: "public_token is required" }, { status: 400 });
    }
    const itemId = await exchangeAndInit(publicToken);
    return NextResponse.json({ item_id: itemId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to exchange token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
