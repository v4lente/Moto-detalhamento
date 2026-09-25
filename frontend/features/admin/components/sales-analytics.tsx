import type { DashboardAnalytics } from "@shared/contracts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { formatCurrencyBRL } from "@/shared/lib/formatters";

export function SalesAnalytics({ data }: { data: DashboardAnalytics["products"] }) {
  const sampleIsSmall = data.soldOrders < 10;
  const maxOrders = Math.max(1, ...data.series.map((point) => point.orders));
  return (
    <Card data-testid="sales-analytics">
      <CardHeader>
        <CardTitle>Vendas de produtos</CardTitle>
        <CardDescription>
          Por data de criação do pedido. {data.inferredLegacyOrders} venda(s) histórica(s) inferida(s), sem confirmação de recebimento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {sampleIsSmall && <p className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">Amostra pequena ({data.soldOrders} pedidos); interprete rankings e horários com cautela.</p>}
        {data.series.some((point) => point.orders > 0) ? (
          <div className="flex h-56 items-end gap-1 overflow-x-auto border-b border-l border-border p-2" role="img" aria-label="Série diária de pedidos vendidos">
            {data.series.map((point) => <div key={point.date} className="flex min-w-5 flex-1 flex-col items-center justify-end gap-1" title={`${point.date}: ${point.orders} pedido(s)`}>
              <span className="text-[10px] text-muted-foreground">{point.orders || ""}</span>
              <span className="w-full min-w-3 rounded-t bg-primary/80" style={{ height: `${Math.max(point.orders ? 4 : 0, (point.orders / maxOrders) * 150)}px` }} />
              <span className="-rotate-45 whitespace-nowrap text-[9px] text-muted-foreground">{point.date.slice(5)}</span>
            </div>)}
          </div>
        ) : <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma venda no período.</p>}

        <div className="overflow-x-auto">
          <table className="sr-only"><caption>Série diária textual de pedidos</caption><thead><tr><th>Data</th><th>Pedidos</th><th>Unidades</th><th>Valor</th></tr></thead><tbody>{data.series.map((point) => <tr key={point.date}><td>{point.date}</td><td>{point.orders}</td><td>{point.units}</td><td>{point.soldValueCents}</td></tr>)}</tbody></table>
          <table className="w-full text-sm">
            <caption className="sr-only">Ranking textual de produtos vendidos</caption>
            <thead><tr className="border-b text-left"><th className="py-2">Produto</th><th>Unidades</th><th>Valor</th></tr></thead>
            <tbody>{data.topProducts.map((item) => (
              <tr key={`${item.productId}-${item.variationId}-${item.productName}`} className="border-b border-border/50">
                <td className="py-2">{item.productName}{item.variationLabel ? ` · ${item.variationLabel}` : ""}</td>
                <td>{item.units}</td><td>{formatCurrencyBRL(item.valueCents / 100)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Demanda por dia e hora</p>
          <div className="flex flex-wrap gap-2">{data.weekdayHours.map((item) => <span key={`${item.weekday}-${item.hour}`} className="rounded bg-muted px-2 py-1 text-xs">D{item.weekday} · {String(item.hour).padStart(2, "0")}h: {item.orders}</span>)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
