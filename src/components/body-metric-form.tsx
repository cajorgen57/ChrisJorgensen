"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

function todayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function BodyMetricForm() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    setBusy(true);
    try {
      const fd = new FormData(e.currentTarget);
      const payload: Record<string, unknown> = { date: fd.get("date") };
      const numericFields = ["weightKg", "bodyFatPct", "waistCm", "restingHrBpm", "hrvMs", "sleepHours", "steps"];
      for (const k of numericFields) {
        const v = fd.get(k);
        if (typeof v === "string" && v.trim() !== "") {
          const n = Number(v);
          if (Number.isFinite(n)) payload[k] = n;
        }
      }
      const notes = fd.get("notes");
      if (typeof notes === "string" && notes.trim()) payload.notes = notes;

      const r = await fetch("/api/body/metric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Save failed");
      setDone(true);
      (e.target as HTMLFormElement).reset();
      // Reset date input back to today
      const dateInput = document.getElementById("body-date") as HTMLInputElement | null;
      if (dateInput) dateInput.value = todayIso();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <Field label="Date" name="date" type="date" defaultValue={todayIso()} required id="body-date" />
        <Field label="Weight (kg)" name="weightKg" type="number" step="0.1" placeholder="e.g. 78.4" />
        <Field label="Body fat %" name="bodyFatPct" type="number" step="0.1" placeholder="e.g. 18.5" />
        <Field label="Waist (cm)" name="waistCm" type="number" step="0.1" placeholder="e.g. 82" />
        <Field label="Resting HR (bpm)" name="restingHrBpm" type="number" step="1" placeholder="e.g. 56" />
        <Field label="HRV (ms)" name="hrvMs" type="number" step="0.1" placeholder="e.g. 65" />
        <Field label="Sleep (hours)" name="sleepHours" type="number" step="0.1" placeholder="e.g. 7.5" />
        <Field label="Steps" name="steps" type="number" step="1" placeholder="e.g. 8200" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="body-notes">Notes</Label>
        <textarea
          id="body-notes"
          name="notes"
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Anything worth remembering about today"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save metrics
        </Button>
        {done ? <span className="text-sm text-finance-income">Saved</span> : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Saving the same date again will overwrite that day&apos;s entry.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  id,
  ...rest
}: { label: string; name: string; id?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const inputId = id ?? `body-${name}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <Input id={inputId} name={name} {...rest} />
    </div>
  );
}
