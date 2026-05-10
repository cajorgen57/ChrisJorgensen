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

export function DexaForm() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    setBusy(true);
    try {
      const fd = new FormData(e.currentTarget);
      const r = await fetch("/api/body/dexa", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Save failed");
      setDone(true);
      formRef.current?.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <Field label="Scan date" name="scanDate" type="date" defaultValue={todayIso()} required />
        <Field label="Provider" name="provider" type="text" placeholder="e.g. BodySpec" />
        <Field label="Total mass (kg)" name="totalMassKg" type="number" step="0.01" />
        <Field label="Lean mass (kg)" name="leanMassKg" type="number" step="0.01" />
        <Field label="Fat mass (kg)" name="fatMassKg" type="number" step="0.01" />
        <Field label="Body fat %" name="bodyFatPct" type="number" step="0.1" />
        <Field label="VAT mass (g)" name="vatMassG" type="number" step="1" />
        <Field label="BMC (kg)" name="bmcKg" type="number" step="0.001" />
        <Field label="BMD (g/cm²)" name="bmdGcm2" type="number" step="0.001" />
        <Field label="Android fat %" name="androidFatPct" type="number" step="0.1" />
        <Field label="Gynoid fat %" name="gynoidFatPct" type="number" step="0.1" />
        <Field label="A/G ratio" name="agRatio" type="number" step="0.01" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dexa-notes">Notes</Label>
        <textarea
          id="dexa-notes"
          name="notes"
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Comparison to last scan, training cycle context, etc."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dexa-report">Report PDF (optional)</Label>
        <Input id="dexa-report" name="report" type="file" accept="application/pdf" />
        <p className="text-xs text-muted-foreground">
          File is stored locally under <code>uploads/dexa/</code> and never committed to git.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save scan
        </Button>
        {done ? <span className="text-sm text-finance-income">Saved</span> : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  ...rest
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `dexa-${name}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} {...rest} />
    </div>
  );
}
