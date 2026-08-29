import { notFound } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatNaira, formatQty } from "@/lib/format";
import { getSale } from "@/server/services/sales";
import { RecordPayment } from "./record-payment";

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sale = await getSale(id);
  if (!sale) notFound();

  return (
    <div className="space-y-5">
      <PageHeader
        title={sale.customer?.name ?? "Walk-in sale"}
        subtitle={formatDate(sale.saleDate)}
        backHref="/sales"
        action={
          sale.paymentStatus !== "PAID" ? (
            <Badge variant={sale.paymentStatus === "UNPAID" ? "destructive" : "secondary"}>
              {sale.paymentStatus === "UNPAID" ? "Unpaid" : "Part paid"}
            </Badge>
          ) : (
            <Badge variant="secondary">Paid</Badge>
          )
        }
      />

      <Card>
        <CardContent>
          <ul className="divide-y">
            {sale.items.map((item) => (
              <li key={item.id} className="flex justify-between py-2 text-sm">
                <span>
                  <span className="block">
                    {item.name}
                    {item.packageSize ? ` · ${item.packageSize}` : ""}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatQty(item.quantity)} × {formatNaira(item.unitPrice)}
                  </span>
                </span>
                <span className="font-medium">{formatNaira(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 space-y-1.5 border-t pt-3 text-sm">
            <div className="flex justify-between text-base">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{formatNaira(sale.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid</span>
              <span>{formatNaira(sale.amountPaid)}</span>
            </div>
            {sale.outstanding > 0 ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Owing</span>
                <span className="text-warning font-medium">{formatNaira(sale.outstanding)}</span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {sale.outstanding > 0 ? (
        <Card>
          <CardContent>
            <RecordPayment saleId={sale.id} outstanding={sale.outstanding} />
          </CardContent>
        </Card>
      ) : null}

      {sale.notes ? (
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-xs uppercase">Notes</p>
            <p className="text-sm">{sale.notes}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
