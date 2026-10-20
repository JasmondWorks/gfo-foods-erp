import { Settings, User } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/services/auth-guard";
import { getSettings } from "@/server/services/settings";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const [user, settings] = await Promise.all([requireUser(), getSettings()]);

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      <PageHeader
        title="Settings & Business Profile"
        subtitle="Manage business identity, ledger currency, and system preferences"
      />

      <div className="space-y-6">
        <Card className="shadow-xs border-border/80">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Settings className="size-4 text-primary" />
              <span>General Business Configuration</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Brand and operating defaults for GFO Foods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm initialSettings={settings} />
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              <span>Owner Account & Security</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Authenticated credentials for ERP ledger access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Admin User</span>
              <span className="font-semibold text-foreground">{user.name ?? "Business Owner"}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Login Email</span>
              <span className="font-mono text-xs text-foreground">{user.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Session Duration</span>
              <span className="text-xs font-medium text-success">Active (30-day token)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
