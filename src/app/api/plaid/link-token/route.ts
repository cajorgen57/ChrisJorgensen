import { NextResponse } from "next/server";
import { createLinkToken } from "@/lib/plaid-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const token = await createLinkToken();
    return NextResponse.json({ link_token: token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create link token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
