"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, Package, Plus, Receipt, ShoppingBag, ShoppingCart, X } from "lucide-react";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [quickOpen, setQuickOpen] = useState(false);
  const mounted = useMounted();

  // Close when pathname changes during render
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setQuickOpen(false);
  }

  // Lock body scroll when quick open is active
  useEffect(() => {
    if (quickOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [quickOpen]);

  const quickModal = quickOpen && mounted && (
    <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={() => setQuickOpen(false)}
        aria-hidden="true"
      />
      <div className="relative bg-card text-card-foreground rounded-t-2xl border-t border-border p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between pb-3 border-b mb-4">
          <span className="font-semibold text-base">Quick Record</span>
          <button
            onClick={() => setQuickOpen(false)}
            className="text-muted-foreground p-1 hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 pb-2">
          <Link
            href="/sales/new"
            onClick={() => setQuickOpen(false)}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-primary/20 bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-all active:scale-98"
          >
            <ShoppingBag className="size-6" />
            <span className="text-sm font-semibold">+ New Sale</span>
          </Link>
          <Link
            href="/batches/new"
            onClick={() => setQuickOpen(false)}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-chart-2/20 bg-chart-2/10 text-chart-2 font-medium hover:bg-chart-2/20 transition-all active:scale-98"
          >
            <Layers className="size-6" />
            <span className="text-sm font-semibold">+ New Batch</span>
          </Link>
          <Link
            href="/purchases/new"
            onClick={() => setQuickOpen(false)}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-chart-3/20 bg-chart-3/10 text-chart-3 font-medium hover:bg-chart-3/20 transition-all active:scale-98"
          >
            <ShoppingCart className="size-6" />
            <span className="text-sm font-semibold">+ Purchase</span>
          </Link>
          <Link
            href="/expenses/new"
            onClick={() => setQuickOpen(false)}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-warning/20 bg-warning/10 text-warning font-medium hover:bg-warning/20 transition-all active:scale-98"
          >
            <Receipt className="size-6" />
            <span className="text-sm font-semibold">+ Expense</span>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {mounted && quickModal ? createPortal(quickModal, document.body) : null}

      {/* Sleek Bottom Tab Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="relative mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {/* Tab 1: Home */}
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 pt-1 pb-0.5 text-[11px] font-medium transition-colors",
              pathname === "/" ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Home className="size-5" aria-hidden="true" />
            <span>Home</span>
          </Link>

          {/* Tab 2: Sales */}
          <Link
            href="/sales"
            aria-current={pathname.startsWith("/sales") ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 pt-1 pb-0.5 text-[11px] font-medium transition-colors",
              pathname.startsWith("/sales") ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            <span>Sales</span>
          </Link>

          {/* Center: Floating Quick Action Button */}
          <div className="relative flex h-full flex-1 items-center justify-center">
            <button
              type="button"
              onClick={() => setQuickOpen(true)}
              className="absolute -top-5 flex size-12 items-center justify-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow-lg shadow-primary/35 transition-all hover:bg-primary/90 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Quick Action"
            >
              <Plus className="size-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Tab 3: Products */}
          <Link
            href="/products"
            aria-current={pathname.startsWith("/products") ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 pt-1 pb-0.5 text-[11px] font-medium transition-colors",
              pathname.startsWith("/products") ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Package className="size-5" aria-hidden="true" />
            <span>Products</span>
          </Link>

          {/* Tab 4: Batches */}
          <Link
            href="/batches"
            aria-current={pathname.startsWith("/batches") ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 pt-1 pb-0.5 text-[11px] font-medium transition-colors",
              pathname.startsWith("/batches") ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Layers className="size-5" aria-hidden="true" />
            <span>Batches</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
