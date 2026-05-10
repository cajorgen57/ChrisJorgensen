"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2, Loader2 } from "lucide-react";

export function SyncItemButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        setBusy(true);
        try {
          const r = await fetch("/api/plaid/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ item_id: itemId }),
          });
          if (!r.ok) {
            const j = await r.json().catch(() => ({}));
            alert(j.error ?? "Sync failed");
          }
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
      Sync
    </Button>
  );
}

export function SyncAllButton() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/plaid/sync", { method: "POST" });
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
      Sync all
    </Button>
  );
}

export function RemoveItemButton({ itemId, name }: { itemId: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive"
      onClick={async () => {
        if (!confirm(`Remove ${name}? Transactions and balances for this institution will be deleted locally.`)) return;
        setBusy(true);
        try {
          await fetch("/api/plaid/remove", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ item_id: itemId }),
          });
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      Remove
    </Button>
  );
}
