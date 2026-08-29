"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DateField, QuantityInput } from "@/components/common/entry-fields";
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
    <form action={formAction} className="space-y-5">
      <div className="space-y-3">
        {rows.map((row) => {
          const product = byId.get(row.productId);
          return (
            <div key={row.key} className="space-y-2 rounded-xl border p-3">
              <input type="hidden" name="productId" value={row.productId} />
              <div className="flex gap-2">
                <Select
                  value={row.productId}
                  onValueChange={(value) => pickProduct(row.key, value)}
                >
                  <SelectTrigger className="w-full" aria-label="Product">
                    <SelectValue placeholder="Pick a product" />
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
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <QuantityInput
                name="quantity"
                value={row.quantity}
                onChange={(value) => updateRow(row.key, { quantity: value })}
              />

              <div className="flex items-center gap-2">
                <Input
                  name="unitPrice"
                  inputMode="decimal"
                  value={row.unitPrice}
                  onChange={(e) => updateRow(row.key, { unitPrice: e.target.value })}
                  aria-label="Unit price"
                  placeholder="Price each"
                />
                <span className="w-24 shrink-0 text-right text-sm font-medium">
                  {formatNaira(Number(row.quantity || 0) * Number(row.unitPrice || 0))}
                </span>
              </div>

              {product && product.quantityOnHand < Number(row.quantity || 0) ? (
                <p className="text-warning text-xs">
                  Only {product.quantityOnHand} in stock — saving anyway is fine.
                </p>
              ) : null}
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          onClick={() => setRows((r) => [...r, blankRow()])}
          className="w-full"
        >
          <Plus className="size-4" />
          Add product
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-1.5 text-sm">
          <div className="flex justify-between text-base">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{formatNaira(total)}</span>
          </div>
          {amountPaid !== "" && outstanding > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Owing</span>
              <span className="text-warning font-medium">{formatNaira(outstanding)}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-1.5">
        <Label htmlFor="amountPaid">Amount paid (₦)</Label>
        <Input
          id="amountPaid"
          name="amountPaid"
          inputMode="decimal"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          placeholder="Leave blank if paid in full"
        />
        {state.errors?.amountPaid ? (
          <p role="alert" className="text-destructive text-xs">
            {state.errors.amountPaid[0]}
          </p>
        ) : null}
      </div>

      <Field
        label="Customer"
        htmlFor="customerName"
        hint="Optional — leave blank for a walk-in sale."
        errors={state.errors?.customerName}
      >
        <Input id="customerName" name="customerName" placeholder="Name" />
      </Field>

      <DateField name="saleDate" label="Date sold" errors={state.errors?.saleDate} />

      <FormMessage message={state.message} tone={state.ok ? "success" : "error"} />

      <div className="space-y-2">
        <SubmitButton>Save</SubmitButton>
        <SubmitButton intent="save-and-add-another" variant="outline">
          Save &amp; add another
        </SubmitButton>
      </div>
    </form>
  );
}
