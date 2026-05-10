"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  LineChart,
  Scissors,
  Apple,
  Activity,
  Settings,
} from "lucide-react";

const sections: { label: string; items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Finance",
    items: [
      { href: "/accounts", label: "Accounts", icon: Wallet },
      { href: "/transactions", label: "Transactions", icon: Receipt },
      { href: "/investments", label: "Investments", icon: LineChart },
      { href: "/tax", label: "Tax-Loss Harvesting", icon: Scissors },
    ],
  },
  {
    label: "Wellness",
    items: [
      { href: "/nutrition", label: "Nutrition", icon: Apple },
      { href: "/body", label: "Body & DEXA", icon: Activity },
    ],
  },
  {
    label: "System",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/60 bg-card/30 backdrop-blur">
      <div className="px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-finance-invest to-fitness-accent" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Personal Tracker</span>
            <span className="text-[11px] text-muted-foreground">finance · fitness</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-6">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {section.label}
            </div>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
