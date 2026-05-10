"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";

interface ImportResult {
  rowsImported: number;
  rowsSkippedDuplicate: number;
  totalRowsParsed?: number;
  batchId: string | null;
}

export function NutritionUpload() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/nutrition/import", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error ?? "Import failed");
      } else {
        setResult(j);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onChange}
          className="hidden"
          id="cronometer-file"
        />
        <Button
          asChild
          disabled={busy}
          variant="default"
        >
          <label htmlFor="cronometer-file" className="cursor-pointer">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {busy ? "Importing…" : "Upload Cronometer CSV"}
          </label>
        </Button>
        <p className="text-xs text-muted-foreground">
          Cronometer → Settings → Account → Export Data → <strong>Servings</strong>
        </p>
      </div>

      {result ? (
        <div className="flex items-center gap-2 text-sm text-finance-income">
          <CheckCircle2 className="h-4 w-4" />
          Imported {result.rowsImported}{" "}
          {result.rowsImported === 1 ? "entry" : "entries"}
          {result.rowsSkippedDuplicate > 0
            ? ` · ${result.rowsSkippedDuplicate} duplicates skipped`
            : ""}
        </div>
      ) : null}

      {error ? <div className="text-sm text-destructive">{error}</div> : null}
    </div>
  );
}
