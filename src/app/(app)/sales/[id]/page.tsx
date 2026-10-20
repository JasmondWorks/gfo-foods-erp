import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Phone, Receipt, User } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatNaira, formatQty } from "@/lib/format";
import { getSale } from "@/server/services/sales";
import { RecordPayment } from "./record-payment";

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sale = await getSale(id);
  if (!sale) notFound();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title={sale.customer?.name ? `Sale to ${sale.customer.name}` : "Walk-in Retail Sale"}
        subtitle={`Transaction date: ${formatDate(sale.saleDate)}`}
        backHref="/sales"
        action={
          sale.paymentStatus === "PAID" ? (
            <Badge variant="secondary" className="text-xs bg-success/15 text-success border-success/30 gap-1.5 py-1 px-3">
              <CheckCircle2 className="size-3.5" />
              <span>Paid in Full</span>
            </Badge>
          ) : sale.paymentStatus === "UNPAID" ? (
            <Badge variant="destructive" className="text-xs py-1 px-3">
              Unpaid Credit
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-warning border-warning/40 bg-warning/5 py-1 px-3">
              Partially Paid
            </Badge>
          )
        }
      />

      {/* Responsive 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Line Items & Invoice Receipt (lg: 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-xs border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Receipt className="size-4 text-primary" />
                  <span>Itemized Order Lines</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Finished products purchased in this transaction
                </CardDescription>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {sale.items.length} line item{sale.items.length !== 1 ? "s" : ""}
              </span>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border/60">
                {sale.items.map((item) => (
                  <li key={item.id} className="flex justify-between items-center py-3 text-sm">
                    <div>
                      <span className="font-semibold block text-foreground">
                        {item.name}
                        {item.packageSize ? (
                          <span className="text-xs text-muted-foreground font-normal">
                            {" "}· {item.packageSize}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatQty(item.quantity)} units × {formatNaira(item.unitPrice)}
                      </span>
                    </div>
                    <span className="font-bold tabular-nums text-foreground">
                      {formatNaira(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Total calculation panel */}
              <div className="mt-4 space-y-2 border-t pt-4 text-sm bg-muted/20 -mx-6 -mb-6 p-6 rounded-b-xl">
                <div className="flex justify-between text-base font-bold">
                  <span>Grand Total</span>
                  <span className="tabular-nums text-primary">{formatNaira(sale.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Amount Paid</span>
                  <span className="tabular-nums font-medium text-foreground">
                    {formatNaira(sale.amountPaid)}
                  </span>
                </div>
                {sale.outstanding > 0 ? (
                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                    <span className="text-destructive">Balance Outstanding</span>
                    <span className="text-destructive tabular-nums">
                      {formatNaira(sale.outstanding)}
                    </span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Customer Info, Payment Settlement & Notes (lg: 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Outstanding Balance Settlement Widget */}
          {sale.outstanding > 0 ? (
            <Card className="border-warning/40 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-warning">
                  <Clock className="size-4" />
                  <span>Settle Outstanding Credit</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Record cash, bank transfer, or partial payment against this bill
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecordPayment saleId={sale.id} outstanding={sale.outstanding} />
              </CardContent>
            </Card>
          ) : null}

          {/* Customer Profile Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span>Customer Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-semibold text-foreground">
                  {sale.customer?.name ?? "Walk-in Retail Customer"}
                </span>
              </div>
              {sale.customer?.phone && (
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-muted-foreground">Phone</span>
                  <a
                    href={`tel:${sale.customer.phone}`}
                    className="text-primary hover:underline font-medium flex items-center gap-1"
                  >
                    <Phone className="size-3" />
                    <span>{sale.customer.phone}</span>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction Notes */}
          {sale.notes ? (
            <Card className="shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sale Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-foreground bg-muted/40 p-3 rounded-lg border leading-relaxed">
                  {sale.notes}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
