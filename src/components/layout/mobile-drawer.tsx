"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Flame,
  Home,
  Layers,
  LogOut,
  Menu,
  Package,
  Plus,
  Receipt,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Wheat,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

interface MobileDrawerProps {
  businessName: string;
  userEmail?: string;
  onSignOut: () => Promise<void>;
}

export function MobileDrawer({ businessName, userEmail, onSignOut }: MobileDrawerProps) {
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const pathname = usePathname();

  // Close when pathname changes during render
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open]);

  const close = () => setOpen(false);

  const links = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/sales", label: "Sales", icon: ShoppingBag },
    { href: "/batches", label: "Production Batches", icon: Layers },
    { href: "/purchases", label: "Purchases", icon: ShoppingCart },
    { href: "/expenses", label: "Expenses", icon: Receipt },
    { href: "/products", label: "Products", icon: Package },
    { href: "/raw-materials", label: "Raw Materials", icon: Wheat },
    { href: "/reports", label: "Reports & Insights", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const drawerContent = open && mounted && (
    <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
      {/* Dark backdrop covering entire viewport */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer content: full viewport height, completely solid background */}
      <div className="relative w-4/5 max-w-xs h-dvh max-h-dvh bg-card text-card-foreground shadow-2xl flex flex-col border-r border-border z-10 overflow-hidden animate-in slide-in-from-left duration-250">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0 bg-card">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <Flame className="size-4.5" />
            </div>
            <div>
              <span className="font-semibold text-sm block leading-tight">{businessName}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Spice ERP
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            className="size-8 text-muted-foreground hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Quick entry shortcuts */}
        <div className="p-3 border-b bg-muted/40 shrink-0">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider mb-2">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/sales/new"
              onClick={close}
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus className="size-3.5" />
              <span>Sale</span>
            </Link>
            <Link
              href="/batches/new"
              onClick={close}
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg bg-chart-2/15 text-chart-2 hover:bg-chart-2/25 transition-colors"
            >
              <Plus className="size-3.5" />
              <span>Batch</span>
            </Link>
            <Link
              href="/purchases/new"
              onClick={close}
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg bg-chart-3/15 text-chart-3 hover:bg-chart-3/25 transition-colors"
            >
              <Plus className="size-3.5" />
              <span>Purchase</span>
            </Link>
            <Link
              href="/expenses/new"
              onClick={close}
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg bg-warning/15 text-warning hover:bg-warning/25 transition-colors"
            >
              <Plus className="size-3.5" />
              <span>Expense</span>
            </Link>
          </div>
        </div>

        {/* Nav Links - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className={cn("size-4.5", active ? "text-primary" : "text-muted-foreground")} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User footer & Sign out */}
        <div className="p-3 border-t bg-muted/30 shrink-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
          </div>
          <form action={onSignOut}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full justify-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              <span>Sign out</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="md:hidden size-9 text-muted-foreground hover:text-foreground"
      >
        <Menu className="size-5" />
      </Button>

      {mounted && drawerContent ? createPortal(drawerContent, document.body) : null}
    </>
  );
}
