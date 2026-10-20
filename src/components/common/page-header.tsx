import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  subtitle,
  backHref,
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60">
      <div className="min-w-0">
        {backHref ? (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mb-1 -ml-2.5 h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link href={backHref}>
              <ChevronLeft className="size-4" />
              <span>Back</span>
            </Link>
          </Button>
        ) : null}
        <h1 className="truncate text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 flex items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 sm:p-12 text-center animate-in fade-in duration-200">
      <div className="max-w-md mx-auto">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {hint ? <p className="text-muted-foreground mt-1.5 text-xs sm:text-sm leading-relaxed">{hint}</p> : null}
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}
