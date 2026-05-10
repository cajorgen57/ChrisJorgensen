import { TopBar } from "@/components/topbar";
import { EmptyState } from "@/components/empty-state";
import { LineChart } from "lucide-react";

export default function InvestmentsPage() {
  return (
    <>
      <TopBar title="Investments" subtitle="Holdings, performance, allocation" />
      <div className="px-6 lg:px-10 py-8 max-w-[1400px]">
        <EmptyState
          icon={LineChart}
          title="No investment data yet"
          description="Plaid Investments will pull holdings, cost basis, and investment transactions across brokerages. Coming in Phase 3."
        />
      </div>
    </>
  );
}
