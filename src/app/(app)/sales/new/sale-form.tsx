"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DateField, QuantityInput } from "@/components/common/entry-fields";
import { Field, FormMessage, SubmitButton } from "@/components/common/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNaira } from "@/lib/format";
import { createSaleAction } from "@/server/actions/entries";
import { EMPTY_FORM_STATE } from "@/server/validation/shared";

type Product = {
  id: string;
  name: string;
  packageSize: string | null;
  sellingPrice: number;
  quantityOnHand: number;
};

type Row = { key: string; productId: string; quantity: string; unitPrice: string };

const blankRow = (): Row => ({
  key: crypto.randomUUID(),
  productId: "",
  quantity: "1",
  unitPrice: "",
});

export function SaleForm({ products }: { products: Product[] }) {
  const [state, formAction] = useActionState(createSaleAction, EMPTY_FORM_STATE);
  const [rows, setRows] = useState<Row[]>([blankRow()]);
  const [amountPaid, setAmountPaid] = useState("");

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const total = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const quantity = Number(row.quantity);
        const price = Number(row.unitPrice);
        return Number.isFinite(quantity) && Number.isFinite(price) ? sum + quantity * price : sum;
      }, 0),
    [rows],
  );

  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  // Picking a product fills its price — she overrides it only when haggling.
  const pickProduct = (key: string, productId: string) => {
    const product = byId.get(productId);
    updateRow(key, { productId, unitPrice: product ? String(product.sellingPrice) : "" });
  };

  const chosen = new Set(rows.map((r) => r.productId).filter(Boolean));
  const outstanding = amountPaid === "" ? 0 : total - Number(amountPaid);

  return (
    <form action={formAction} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Line Items & Inputs (lg: 7 cols) */}
      <div className="lg:col-span-7 space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Products Sold
            </Label>
            <span className="text-xs text-muted-foreground">{rows.length} line item(s)</span>
          </div>

          {rows.map((row) => {
            const product = byId.get(row.productId);
            return (
              <div key={row.key} className="space-y-3 rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
                <input type="hidden" name="productId" value={row.productId} />
                <div className="flex gap-2">
                  <Select
                    value={row.productId}
                    onValueChange={(value) => pickProduct(row.key, value)}
                  >
                    <SelectTrigger className="w-full" aria-label="Product">
                      <SelectValue placeholder="Pick a spice product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          disabled={chosen.has(p.id) && p.id !== row.productId}
                        >
                          {p.name}
                          {p.packageSize ? ` · ${p.packageSize}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove line"
                    onClick={() => setRows((r) => (r.length === 1 ? r : r.filter((x) => x.key !== row.key)))}
                    disabled={rows.length === 1}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Quantity</Label>
                    <QuantityInput
                      name="quantity"
                      value={row.quantity}
                      onChange={(value) => updateRow(row.key, { quantity: value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Unit Price (₦)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        name="unitPrice"
                        inputMode="decimal"
                        value={row.unitPrice}
                        onChange={(e) => updateRow(row.key, { unitPrice: e.target.value })}
                        aria-label="Unit price"
                        placeholder="Price each"
                        className="tabular-nums"
                      />
                      <span className="w-20 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
                        {formatNaira(Number(row.quantity || 0) * Number(row.unitPrice || 0))}
                      </span>
                    </div>
                  </div>
                </div>

                {product && product.quantityOnHand < Number(row.quantity || 0) ? (
                  <p className="text-warning text-xs font-medium">
                    Only {product.quantityOnHand} in stock — saving anyway is allowed.
                  </p>
                ) : null}
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            onClick={() => setRows((r) => [...r, blankRow()])}
            className="w-full gap-2 border-dashed"
          >
            <Plus className="size-4" />
            <span>Add another product line</span>
          </Button>
        </div>

        <div className="space-y-4 pt-2">
          <Field
            label="Customer Name"
            htmlFor="customerName"
            hint="Optional — leave blank for walk-in retail sales."
            errors={state.errors?.customerName}
          >
            <Input id="customerName" name="customerName" placeholder="e.g. Iya Basira / Mama Titi Stores" />
          </Field>

          <DateField name="saleDate" label="Transaction Date" errors={state.errors?.saleDate} />
        </div>
      </div>

      {/* Right Column: Sticky Summary & Payment (lg: 5 cols) */}
      <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Sale Summary & Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between items-baseline text-lg font-bold border-b pb-3">
              <span>Grand Total</span>
              <span className="tabular-nums text-primary text-xl">{formatNaira(total)}</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amountPaid" className="text-xs font-medium">
                Amount Paid (₦)
              </Label>
              <Input
                id="amountPaid"
                name="amountPaid"
                inputMode="decimal"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="Leave blank if fully paid"
                className="tabular-nums text-base"
              />
              <p className="text-[11px] text-muted-foreground">
                Leave blank if paid in full (cash or transfer).
              </p>
              {state.errors?.amountPaid ? (
                <p role="alert" className="text-destructive text-xs">
                  {state.errors.amountPaid[0]}
                </p>
              ) : null}
            </div>

            {amountPaid !== "" && outstanding > 0 ? (
              <div className="flex justify-between items-center p-3 rounded-lg bg-warning/10 border border-warning/20">
                <span className="text-warning font-semibold text-xs">Customer Owes (Credit)</span>
                <span className="text-warning font-bold tabular-nums">{formatNaira(outstanding)}</span>
              </div>
            ) : null}

            <FormMessage message={state.message} tone={state.ok ? "success" : "error"} />

            <div className="space-y-2 pt-2">
              <SubmitButton className="w-full h-11 text-sm font-semibold">
                Record Sale
              </SubmitButton>
              <SubmitButton intent="save-and-add-another" variant="outline" className="w-full text-xs">
                Record &amp; add another
              </SubmitButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
