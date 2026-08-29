"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/form";
import { todayInputValue } from "@/lib/format";

/**
 * Every entry form carries a date, defaulting to today but freely changeable to
 * any past date — she catches up in the evening, not mid-transaction (FR-8).
 */
export function DateField({
  name = "date",
  label = "Date",
  defaultValue,
  errors,
  allowFuture = false,
}: {
  name?: string;
  label?: string;
  defaultValue?: string;
  errors?: string[];
  /** Expiry dates are in the future; dates something happened on are not. */
  allowFuture?: boolean;
}) {
  return (
    <Field label={label} htmlFor={name} errors={errors}>
      <Input
        id={name}
        name={name}
        type="date"
        defaultValue={defaultValue ?? todayInputValue()}
        max={allowFuture ? undefined : todayInputValue()}
      />
    </Field>
  );
}

/**
 * Quantity stepper alongside the numeric input (BUILD_SPEC §3.3) — tapping beats
 * summoning a phone keyboard for the common small numbers.
 */
export function QuantityInput({
  name,
  value,
  onChange,
  step = 1,
  ariaLabel = "Quantity",
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
  ariaLabel?: string;
}) {
  const nudge = (direction: 1 | -1) => {
    const current = Number(value);
    const base = Number.isFinite(current) ? current : 0;
    const next = Math.max(0, Math.round((base + direction * step) * 1000) / 1000);
    onChange(String(next));
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={`Decrease ${ariaLabel.toLowerCase()}`}
        onClick={() => nudge(-1)}
      >
        <Minus className="size-4" />
      </Button>
      <Input
        name={name}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="text-center"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={`Increase ${ariaLabel.toLowerCase()}`}
        onClick={() => nudge(1)}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
