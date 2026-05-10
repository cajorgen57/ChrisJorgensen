"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, X, Loader2 } from "lucide-react";

export function RegenerateTlhButton() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <Button
      onClick={async () => {
        setBusy(true);
        try {
          const r = await fetch("/api/tlh/regenerate", { method: "POST" });
          if (!r.ok) {
            const j = await r.json().catch(() => ({}));
            alert(j.error ?? "Regeneration failed");
          }
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      {busy ? "Analyzing…" : "Regenerate"}
    </Button>
  );
}

export function CandidateActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function update(status: "dismissed" | "acted") {
    setBusy(true);
    try {
      await fetch("/api/tlh/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => update("acted")}
        disabled={busy}
        title="Mark as acted on (e.g. you already harvested this loss)"
      >
        <Check className="h-3.5 w-3.5" /> Acted
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => update("dismissed")}
        disabled={busy}
        title="Hide this suggestion"
      >
        <X className="h-3.5 w-3.5" /> Dismiss
      </Button>
    </div>
  );
}
