import Link from "next/link";
import { BarChart3, LogOut, Settings } from "lucide-react";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { MobileDrawer } from "./mobile-drawer";

interface AppHeaderProps {
  businessName: string;
  userEmail?: string;
  userName?: string;
}

export function AppHeader({ businessName, userEmail }: AppHeaderProps) {
  const handleSignOut = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  const todayStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());

  return (
    <header className="bg-card/95 sticky top-0 z-20 border-b border-border/80 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Brand & Drawer / Desktop Context */}
        <div className="flex items-center gap-3">
          <MobileDrawer
            businessName={businessName}
            userEmail={userEmail}
            onSignOut={handleSignOut}
          />
          <Link href="/" className="md:hidden flex items-center gap-2 font-bold text-base tracking-tight">
            <span>{businessName}</span>
          </Link>

          {/* Desktop Left context */}
          <div className="hidden md:flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/60">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              <span>Lagos Business Day · {todayStr}</span>
            </span>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Desktop Quick links */}
          <div className="hidden md:flex items-center gap-1">
            <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-medium">
              <Link href="/reports">
                <BarChart3 className="size-3.5 text-primary" />
                <span>Reports</span>
              </Link>
            </Button>
          </div>

          <Button asChild variant="ghost" size="icon" aria-label="Settings" className="size-9">
            <Link href="/settings">
              <Settings className="size-4.5 text-muted-foreground hover:text-foreground" />
            </Link>
          </Button>

          <form action={handleSignOut} className="md:hidden">
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              className="size-9 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="size-4.5" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
