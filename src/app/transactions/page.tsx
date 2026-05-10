import { TopBar } from "@/components/topbar";
import { EmptyState } from "@/components/empty-state";
import { Receipt } from "lucide-react";

export default function TransactionsPage() {
  return (
    <>
      <TopBar title="Transactions" subtitle="All accounts" />
      <div className="px-6 lg:px-10 py-8 max-w-[1400px]">
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Once accounts are linked, transactions sync via Plaid /transactions/sync. Coming in Phase 2."
        />
      </div>
    </>
  );
}
