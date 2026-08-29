"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  hint,
  errors,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  const errorId = `${htmlFor}-error`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !errors?.length ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
      {errors?.length ? (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}

export function SubmitButton({
  children,
  intent,
  variant,
  className,
}: {
  children: React.ReactNode;
  intent?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      name={intent ? "intent" : undefined}
      value={intent}
      variant={variant}
      disabled={pending}
      className={cn("w-full", className)}
    >
      {pending ? "Saving…" : children}
    </Button>
  );
}

export function FormMessage({ message, tone = "error" }: { message?: string; tone?: "error" | "success" }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className={cn("text-sm", tone === "error" ? "text-destructive" : "text-success")}
    >
      {message}
    </p>
  );
}
