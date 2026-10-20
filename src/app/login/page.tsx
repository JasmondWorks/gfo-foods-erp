import { redirect } from "next/navigation";
import { Flame, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSettings } from "@/server/services/settings";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  const settings = await getSettings();

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-background via-background to-muted/30">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-6">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 mb-3">
            <Flame className="size-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {settings.businessName}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Spice &amp; Food Processing Management System
          </p>
        </div>

        <Card className="shadow-lg border-border/80 backdrop-blur-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Sign in to ERP</CardTitle>
            <CardDescription className="text-xs">
              Enter your owner credentials to access inventory and sales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-success" />
          <span>Single-user encrypted ledger · Stays signed in 30 days</span>
        </div>
      </div>
    </main>
  );
}
