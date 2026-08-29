"use client";

import { useActionState, useMemo, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import type { Unit } from "@prisma/client";
import { Field, FormMessage, SubmitButton } from "@/components/common/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatNaira } from "@/lib/format";
import { UNITS, unitLabel } from "@/lib/units";
import { saveRecipeAction } from "@/server/actions/products";
import { EMPTY_FORM_STATE } from "@/server/validation/shared";

type Material = { id: string; name: string; unit: Unit; averageCost: number };
type Row = { key: string; rawMaterialId: string; quantity: string };

export function RecipeEditor({
  productId,
  productName,
  sellingPrice,
  materials,
  initial,
}: {
  productId: string;
  productName: string;
  sellingPrice: number;
  materials: Material[];
  initial: { yieldQty: string; yieldUnit: Unit | ""; notes: string; ingredients: Row[] };
}) {
  const [state, formAction] = useActionState(
    saveRecipeAction.bind(null, productId),
    EMPTY_FORM_STATE,
  );

  const [rows, setRows] = useState<Row[]>(
    initial.ingredients.length
      ? initial.ingredients
      : [{ key: crypto.randomUUID(), rawMaterialId: "", quantity: "" }],
  );
  const [yieldQty, setYieldQty] = useState(initial.yieldQty);

  const byId = useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);

  /**
   * Live mirror of FR-6, so she sees the margin move as she types. The server
   * recomputes this in Decimal on save — this preview is deliberately float,
   * because it is never persisted.
   */
  const { totalCost, costPerUnit, margin } = useMemo(() => {
    const total = rows.reduce((sum, row) => {
      const material = byId.get(row.rawMaterialId);
      const quantity = Number(row.quantity);
      if (!material || !Number.isFinite(quantity)) return sum;
      return sum + quantity * material.averageCost;
    }, 0);
    const y = Number(yieldQty);
    const perUnit = Number.isFinite(y) && y > 0 ? total / y : 0;
    return { totalCost: total, costPerUnit: perUnit, margin: sellingPrice - perUnit };
  }, [rows, yieldQty, byId, sellingPrice]);

  const addRow = () =>
    setRows((r) => [...r, { key: crypto.randomUUID(), rawMaterialId: "", quantity: "" }]);
  const removeRow = (key: string) =>
    setRows((r) => (r.length === 1 ? r : r.filter((row) => row.key !== key)));
  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const chosen = new Set(rows.map((r) => r.rawMaterialId).filter(Boolean));

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Batch yields" htmlFor="yieldQty" errors={state.errors?.yieldQty}>
          <Input
            id="yieldQty"
            name="yieldQty"
            inputMode="decimal"
            value={yieldQty}
            onChange={(e) => setYieldQty(e.target.value)}
            placeholder="100"
            required
          />
        </Field>
        <Field label="Unit" htmlFor="yieldUnit" errors={state.errors?.yieldUnit}>
          <Select name="yieldUnit" defaultValue={initial.yieldUnit || undefined}>
            <SelectTrigger id="yieldUnit" className="w-full">
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unitLabel(unit)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="space-y-3">
        <Label>Ingredients</Label>
        {rows.map((row) => {
          const material = byId.get(row.rawMaterialId);
          const lineCost = material ? Number(row.quantity || 0) * material.averageCost : 0;
          return (
            <div key={row.key} className="space-y-2 rounded-xl border p-3">
              {/* Explicit hidden input rather than Select's own: an unset Select
                  submits nothing, which would misalign the parallel row arrays. */}
              <input type="hidden" name="rawMaterialId" value={row.rawMaterialId} />
              <div className="flex gap-2">
                <Select
                  value={row.rawMaterialId}
                  onValueChange={(value) => updateRow(row.key, { rawMaterialId: value })}
                >
                  <SelectTrigger className="w-full" aria-label="Material">
                    <SelectValue placeholder="Pick a material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem
                        key={m.id}
                        value={m.id}
                        disabled={chosen.has(m.id) && m.id !== row.rawMaterialId}
                      >
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove ingredient"
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length === 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  name="quantity"
                  inputMode="decimal"
                  value={row.quantity}
                  onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                  placeholder="Quantity"
                  aria-label="Quantity"
                />
                <span className="text-muted-foreground w-24 shrink-0 text-sm">
                  {material ? unitLabel(material.unit) : ""}
                </span>
                <span className="w-24 shrink-0 text-right text-sm font-medium">
                  {material ? formatNaira(lineCost) : ""}
                </span>
              </div>
            </div>
          );
        })}

        <Button type="button" variant="outline" onClick={addRow} className="w-full">
          <Plus className="size-4" />
          Add ingredient
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cost per batch</span>
            <span className="font-medium">{formatNaira(totalCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Material cost per unit</span>
            <span className="font-medium">{formatNaira(costPerUnit)}</span>
          </div>
          <div className="flex justify-between border-t pt-1.5">
            <span className="text-muted-foreground">
              Margin at {formatNaira(sellingPrice)}
            </span>
            <span className={`font-semibold ${margin < 0 ? "text-destructive" : "text-success"}`}>
              {formatNaira(margin)}
            </span>
          </div>
          {margin < 0 ? (
            <p className="text-destructive text-xs">
              {productName} currently costs more to make than it sells for.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Field label="Notes" htmlFor="notes" errors={state.errors?.notes}>
        <Textarea id="notes" name="notes" defaultValue={initial.notes} rows={3} />
      </Field>

      <FormMessage message={state.message} />
      <SubmitButton>Save recipe</SubmitButton>
    </form>
  );
}
