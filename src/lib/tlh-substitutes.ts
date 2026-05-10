// Curated map of "not substantially identical" ETF/fund swaps.
//
// IMPORTANT: this is a heuristic informed by widely-discussed practice, not
// tax advice. The IRS doesn't publish a definitive list. The convention here
// is to swap between funds tracking *different* (but similar) indices —
// e.g. an S&P 500 fund for a total-market fund, or two providers' total-US
// funds. Same-index ETFs from different providers (VOO ↔ IVV) are riskier
// because the indices are identical; they're listed but flagged.
//
// The rationale string is shown to the user when offering the swap.

export interface Substitute {
  ticker: string;
  rationale: string;
  riskFlag?: "same-index" | "similar-index";
}

export const TLH_SUBSTITUTES: Record<string, Substitute[]> = {
  // ----- US Large-cap -----
  VOO: [
    { ticker: "SPLG", rationale: "S&P 500 (SPDR), different provider", riskFlag: "same-index" },
    { ticker: "ITOT", rationale: "Total US market (different index)", riskFlag: "similar-index" },
    { ticker: "VTI", rationale: "Total US market (different index)", riskFlag: "similar-index" },
  ],
  IVV: [
    { ticker: "SPLG", rationale: "S&P 500 (SPDR), different provider", riskFlag: "same-index" },
    { ticker: "VOO", rationale: "S&P 500 (Vanguard), different provider", riskFlag: "same-index" },
    { ticker: "ITOT", rationale: "Total US market (different index)", riskFlag: "similar-index" },
  ],
  SPY: [
    { ticker: "SPLG", rationale: "S&P 500 (SPDR low-fee), different fund", riskFlag: "same-index" },
    { ticker: "VOO", rationale: "S&P 500 (Vanguard), different provider", riskFlag: "same-index" },
    { ticker: "ITOT", rationale: "Total US market (different index)", riskFlag: "similar-index" },
  ],
  SPLG: [
    { ticker: "VOO", rationale: "S&P 500 (Vanguard), different provider", riskFlag: "same-index" },
    { ticker: "ITOT", rationale: "Total US market (different index)", riskFlag: "similar-index" },
  ],

  // ----- US Total Market -----
  VTI: [
    { ticker: "ITOT", rationale: "Total US market, S&P broad index", riskFlag: "similar-index" },
    { ticker: "SCHB", rationale: "Total US market (Schwab)", riskFlag: "similar-index" },
    { ticker: "VOO", rationale: "S&P 500 (large-cap subset)", riskFlag: "similar-index" },
  ],
  ITOT: [
    { ticker: "VTI", rationale: "Total US market (CRSP index)", riskFlag: "similar-index" },
    { ticker: "SCHB", rationale: "Total US market (Schwab)", riskFlag: "similar-index" },
  ],
  SCHB: [
    { ticker: "VTI", rationale: "Total US market (CRSP index)", riskFlag: "similar-index" },
    { ticker: "ITOT", rationale: "Total US market (S&P broad)", riskFlag: "similar-index" },
  ],

  // ----- US Mid / Small -----
  IJH: [{ ticker: "VO", rationale: "US mid-cap (different index)", riskFlag: "similar-index" }],
  IJR: [{ ticker: "VB", rationale: "US small-cap (different index)", riskFlag: "similar-index" }],
  VB: [{ ticker: "IJR", rationale: "US small-cap (different index)", riskFlag: "similar-index" }],

  // ----- International -----
  VXUS: [
    { ticker: "IXUS", rationale: "Total int'l ex-US (iShares)", riskFlag: "similar-index" },
    { ticker: "FTIHX", rationale: "Total int'l (Fidelity ZERO)", riskFlag: "similar-index" },
  ],
  IXUS: [
    { ticker: "VXUS", rationale: "Total int'l ex-US (Vanguard)", riskFlag: "similar-index" },
  ],
  VEA: [{ ticker: "IEFA", rationale: "Developed markets ex-US", riskFlag: "similar-index" }],
  VWO: [{ ticker: "IEMG", rationale: "Emerging markets", riskFlag: "similar-index" }],

  // ----- Bonds -----
  BND: [
    { ticker: "AGG", rationale: "US aggregate bond (iShares)", riskFlag: "similar-index" },
    { ticker: "SCHZ", rationale: "US aggregate bond (Schwab)", riskFlag: "similar-index" },
  ],
  AGG: [
    { ticker: "BND", rationale: "US aggregate bond (Vanguard)", riskFlag: "similar-index" },
    { ticker: "SCHZ", rationale: "US aggregate bond (Schwab)", riskFlag: "similar-index" },
  ],
  BNDX: [{ ticker: "IAGG", rationale: "Int'l aggregate bond", riskFlag: "similar-index" }],
  VTEB: [{ ticker: "MUB", rationale: "Tax-exempt municipal bonds", riskFlag: "similar-index" }],

  // ----- World / All-in-one -----
  VT: [{ ticker: "URTH", rationale: "MSCI World (developed only — narrower)", riskFlag: "similar-index" }],

  // ----- Tech / Sector -----
  QQQ: [
    { ticker: "VGT", rationale: "US tech sector (different index)", riskFlag: "similar-index" },
    { ticker: "XLK", rationale: "S&P 500 tech (different index)", riskFlag: "similar-index" },
  ],
};

export function findSubstitutes(ticker: string | null | undefined): Substitute[] {
  if (!ticker) return [];
  return TLH_SUBSTITUTES[ticker.toUpperCase()] ?? [];
}
