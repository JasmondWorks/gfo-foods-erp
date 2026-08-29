import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/nav";
import { Toaster } from "@/components/ui/sonner";
import { requireUser } from "@/server/services/auth-guard";
import { getSettings } from "@/server/services/settings";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  const settings = await getSettings();

  return (
    <div className="min-h-dvh">
      <AppHeader businessName={settings.businessName} />
      {/* pb-24 clears the fixed bottom nav */}
      <main className="mx-auto max-w-lg px-4 pb-24 pt-4">{children}</main>
      <BottomNav />
      <Toaster position="top-center" />
    </div>
  );
}
