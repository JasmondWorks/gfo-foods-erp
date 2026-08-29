"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Package, ShoppingBag, Wheat } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bottom tab bar. Five destinations, thumb-reachable, no hamburger —
 * every extra tap competes with her real work.
 */
const TABS = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/sales", label: "Sales", Icon: ShoppingBag },
  { href: "/products", label: "Products", Icon: Package },
  { href: "/raw-materials", label: "Materials", Icon: Wheat },
  { href: "/reports", label: "Reports", Icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-card fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-lg">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]",
                  active ? "text-primary font-medium" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
