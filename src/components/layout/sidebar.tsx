"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Flame,
  Home,
  Layers,
  LogOut,
  Package,
  Plus,
  Receipt,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Wheat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Operations",
    items: [
      { href: "/", label: "Dashboard", icon: Home },
      { href: "/sales", label: "Sales", icon: ShoppingBag },
      { href: "/batches", label: "Production Batches", icon: Layers },
      { href: "/purchases", label: "Purchases", icon: ShoppingCart },
      { href: "/expenses", label: "Expenses", icon: Receipt },
    ],
  },
  {
    title: "Inventory & Catalog",
    items: [
      { href: "/products", label: "Products", icon: Package },
      { href: "/raw-materials", label: "Raw Materials", icon: Wheat },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/reports", label: "Reports & Insights", icon: BarChart3 },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  businessName: string;
  userEmail?: string;
  userName?: string;
  onSignOut: () => Promise<void>;
}

export function Sidebar({ businessName, userEmail, userName, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground border-sidebar-border hidden md:flex flex-col border-r transition-all duration-300 select-none z-30 sticky top-0 h-dvh",
        collapsed ? "w-18" : "w-64",
      )}
    >
      {/* Brand & Collapse Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border/80 px-4">
        <Link
          href="/"
          className={cn("flex items-center gap-3 overflow-hidden", collapsed && "justify-center w-full")}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
            <Flame className="size-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="block truncate font-bold text-sm tracking-tight">{businessName}</span>
              <span className="text-muted-foreground block text-[11px] font-medium tracking-wide uppercase">
                Spice ERP
              </span>
            </div>
          )}
        </Link>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
            className="text-muted-foreground hover:text-foreground size-7 shrink-0"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="size-4" />
          </Button>
        )}
      </div>

      {/* Quick Action Button */}
      <div className="p-3">
        {collapsed ? (
          <Button
            asChild
            size="icon"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            title="New Sale"
          >
            <Link href="/sales/new">
              <Plus className="size-5" />
            </Link>
          </Button>
        ) : (
          <div className="relative">
            <Button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="w-full justify-between bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-medium text-sm h-10 px-3.5"
            >
              <span className="flex items-center gap-2">
                <Plus className="size-4" />
                <span>Quick Record</span>
              </span>
              <span className="text-[10px] bg-primary-foreground/20 px-1.5 py-0.5 rounded font-mono">
                +
              </span>
            </Button>

            {showQuickMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowQuickMenu(false)}
                />
                <div className="bg-popover text-popover-foreground absolute left-0 right-0 top-12 z-50 rounded-xl border border-border shadow-lg p-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <Link
                    href="/sales/new"
                    onClick={() => setShowQuickMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
                  >
                    <ShoppingBag className="size-4 text-primary" />
                    <span>New Sale</span>
                  </Link>
                  <Link
                    href="/batches/new"
                    onClick={() => setShowQuickMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
                  >
                    <Layers className="size-4 text-chart-2" />
                    <span>New Batch</span>
                  </Link>
                  <Link
                    href="/purchases/new"
                    onClick={() => setShowQuickMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
                  >
                    <ShoppingCart className="size-4 text-chart-3" />
                    <span>New Purchase</span>
                  </Link>
                  <Link
                    href="/expenses/new"
                    onClick={() => setShowQuickMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
                  >
                    <Receipt className="size-4 text-warning" />
                    <span>Record Expense</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Nav Items List */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed && (
              <p className="text-muted-foreground/80 px-3 text-[11px] font-semibold uppercase tracking-wider">
                {group.title}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                        collapsed && "justify-center px-0 py-2.5",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4.5 shrink-0 transition-colors",
                          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                        )}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Expand Button when collapsed */}
      {collapsed && (
        <div className="p-2 border-t border-sidebar-border/80 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            className="size-8 text-muted-foreground hover:text-foreground"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* User Session Footer */}
      <div className="border-t border-sidebar-border/80 p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl p-2 bg-sidebar-accent/50",
            collapsed && "justify-center p-1 bg-transparent",
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold text-xs">
            {(userName ?? userEmail ?? "O").charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium leading-none">{userName ?? "Store Owner"}</p>
              <p className="text-muted-foreground truncate text-[11px] leading-tight mt-0.5">
                {userEmail ?? "owner@gfofoods.ng"}
              </p>
            </div>
          )}
          {!collapsed && (
            <form action={onSignOut}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                aria-label="Sign out"
              >
                <LogOut className="size-3.5" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </aside>
  );
}
