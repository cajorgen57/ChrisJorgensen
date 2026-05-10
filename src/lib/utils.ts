import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCents(cents: bigint | number, currency = "USD") {
  const n = typeof cents === "bigint" ? Number(cents) / 100 : cents / 100;
  return formatCurrency(n, currency);
}

export function formatNumber(n: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export function formatPercent(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits)}%`;
}
