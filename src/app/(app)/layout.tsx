import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { requireUser } from "@/server/services/auth-guard";
import { getSettings } from "@/server/services/settings";
import { signOut } from "@/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const settings = await getSettings();

  const handleSignOut = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <div className="min-h-dvh flex bg-background text-foreground">
      {/* Collapsible desktop sidebar */}
      <Sidebar
        businessName={settings.businessName}
        userEmail={user.email ?? undefined}
        userName={user.name ?? undefined}
        onSignOut={handleSignOut}
      />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          businessName={settings.businessName}
          userEmail={user.email ?? undefined}
          userName={user.name ?? undefined}
        />
        {/* pb-24 on mobile clears the fixed bottom nav, pb-10 on desktop */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10">
          {children}
        </main>
      </div>

      <BottomNav />
      <Toaster position="top-center" />
    </div>
  );
}
