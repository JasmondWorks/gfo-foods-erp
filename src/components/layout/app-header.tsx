import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function AppHeader({ businessName }: { businessName: string }) {
  return (
    <header className="bg-card/95 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <Link href="/" className="text-base font-semibold">
          {businessName}
        </Link>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Settings">
            <Link href="/settings">
              <Settings className="size-5" />
            </Link>
          </Button>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
              <LogOut className="size-5" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
