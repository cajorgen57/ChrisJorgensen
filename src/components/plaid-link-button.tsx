"use client";

import * as React from "react";
import { usePlaidLink } from "react-plaid-link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

interface Props {
  variant?: "default" | "outline" | "secondary";
  label?: string;
}

export function PlaidLinkButton({ variant = "default", label = "Link account" }: Props) {
  const router = useRouter();
  const [linkToken, setLinkToken] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Fetch a fresh link token on mount. Tokens expire (~30min) so we don't
  // cache long-term — refetch each time the page loads.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/plaid/link-token", { method: "POST" });
        const j = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setError(j.error ?? "Failed to load Plaid Link");
        } else {
          setLinkToken(j.link_token);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Network error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSuccess = React.useCallback(
    async (publicToken: string) => {
      setLoading(true);
      try {
        const r = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_token: publicToken }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Exchange failed");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Exchange failed");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Plaid Link unavailable: {error}
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      onClick={() => open()}
      disabled={!ready || !linkToken || loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      {loading ? "Syncing…" : label}
    </Button>
  );
}
