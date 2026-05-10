// Infer whether an account is taxable, tax-advantaged, or unknown based on
// Plaid type/subtype. The user can override per-account later.

const TAX_ADVANTAGED_SUBTYPES = new Set<string>([
  // US retirement
  "401k",
  "401a",
  "403b",
  "457b",
  "ira",
  "roth",
  "roth ira",
  "roth 401k",
  "rollover ira",
  "sep ira",
  "simple ira",
  "sarsep",
  "tsp",
  // US education / health
  "529",
  "hsa",
  "fhsa",
  // Canada
  "rrsp",
  "lira",
  "lif",
  "rrif",
  "tfsa",
  "resp",
  // UK
  "isa",
  "sipp",
]);

export type TaxStatus = "taxable" | "tax_advantaged" | "unknown";

export function inferTaxStatus(type: string, subtype: string | null | undefined): TaxStatus {
  const s = (subtype ?? "").toLowerCase().trim();
  if (s && TAX_ADVANTAGED_SUBTYPES.has(s)) return "tax_advantaged";

  // Generic investment / brokerage account: default to taxable. Real 401(k)/IRA
  // accounts almost always come through with a specific subtype, so this
  // default is the right one for a typical taxable brokerage.
  if (type === "investment") return "taxable";

  // Cash accounts (depository, credit, loan) aren't subject to TLH at all —
  // mark unknown so the TLH engine ignores them.
  return "unknown";
}
