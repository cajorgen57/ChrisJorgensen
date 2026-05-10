import { TopBar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  const env = process.env.PLAID_ENV ?? "(not set)";
  const plaidConfigured = Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
  const secretConfigured = Boolean(process.env.APP_SECRET && process.env.APP_SECRET.length >= 32);

  return (
    <>
      <TopBar title="Settings" subtitle="Configuration and integrations" />
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
            <CardDescription>Read-only summary of values from .env</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Plaid env</dt>
                <dd className="font-medium">{env}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Plaid keys</dt>
                <dd className="font-medium">
                  {plaidConfigured ? "configured" : "missing"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">App secret</dt>
                <dd className="font-medium">
                  {secretConfigured ? "configured" : "missing or too short"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">App URL</dt>
                <dd className="font-medium">{process.env.NEXT_PUBLIC_APP_URL ?? "(not set)"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
