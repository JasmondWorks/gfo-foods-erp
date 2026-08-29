import Link from "next/link";
import { ChevronLeft } from "lucide-react";

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
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="text-muted-foreground mb-1 inline-flex items-center text-sm"
          >
            <ChevronLeft className="size-4" />
            Back
          </Link>
        ) : null}
        <h1 className="truncate text-xl font-semibold">{title}</h1>
        {subtitle ? <p className="text-muted-foreground text-sm">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed p-6 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint ? <p className="text-muted-foreground mt-1 text-sm">{hint}</p> : null}
    </div>
  );
}
