import { TopBar } from "@/components/topbar";
import { EmptyState } from "@/components/empty-state";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccountsPage() {
  return (
    <>
      <TopBar title="Accounts" subtitle="Banks, credit cards, and brokerages" />
      <div className="px-6 lg:px-10 py-8 max-w-[1400px]">
        <EmptyState
          icon={Wallet}
          title="No accounts linked yet"
          description="Plaid Link will be wired up in Phase 2. You'll click 'Link account', authenticate with your institution, and accounts will sync transactions automatically."
          action={<Button disabled>Link account (Phase 2)</Button>}
        />
      </div>
    </>
  );
}
