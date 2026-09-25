import type { DashboardAnalytics } from "@shared/contracts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export function ServiceAnalytics({ data }: { data: DashboardAnalytics["services"] }) {
  const sample = data.completedPaid + data.completedUnpaid;
  const maxCompleted = Math.max(1, ...data.series.map((point) => point.completedPaid));
  return (
    <Card data-testid="service-analytics">
      <CardHeader>
        <CardTitle>Serviços realizados</CardTitle>
        <CardDescription>Conclusões usam a data real de conclusão; ocupação usa o horário agendado.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {sample < 10 && <p className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">Amostra pequena ({sample} serviços concluídos); evite conclusões definitivas.</p>}
        {data.series.some((point) => point.completedPaid > 0) ? (
          <div className="flex h-56 items-end gap-1 overflow-x-auto border-b border-l border-border p-2" role="img" aria-label="Série diária de serviços concluídos pagos">
            {data.series.map((point) => <div key={point.date} className="flex min-w-5 flex-1 flex-col items-center justify-end gap-1" title={`${point.date}: ${point.completedPaid} serviço(s)`}>
              <span className="text-[10px] text-muted-foreground">{point.completedPaid || ""}</span>
              <span className="w-full min-w-3 rounded-t bg-primary/80" style={{ height: `${Math.max(point.completedPaid ? 4 : 0, (point.completedPaid / maxCompleted) * 150)}px` }} />
              <span className="-rotate-45 whitespace-nowrap text-[9px] text-muted-foreground">{point.date.slice(5)}</span>
            </div>)}
          </div>
        ) : <p className="py-10 text-center text-sm text-muted-foreground">Nenhum serviço concluído e pago no período.</p>}
        <div className="overflow-x-auto">
          <table className="sr-only"><caption>Série diária textual de serviços</caption><thead><tr><th>Data</th><th>Concluídos pagos</th><th>Valor</th></tr></thead><tbody>{data.series.map((point) => <tr key={point.date}><td>{point.date}</td><td>{point.completedPaid}</td><td>{point.valueCents}</td></tr>)}</tbody></table>
          <table className="w-full text-sm">
            <caption className="sr-only">Ranking textual de serviços concluídos</caption>
            <thead><tr className="border-b text-left"><th className="py-2">Serviço</th><th>Conclusões</th></tr></thead>
            <tbody>{data.topServices.map((item) => <tr key={`${item.serviceId}-${item.serviceName}`} className="border-b border-border/50"><td className="py-2">{item.serviceName}</td><td>{item.completedCount}</td></tr>)}</tbody>
          </table>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Ocupação agendada por dia e hora</p>
          <div className="flex flex-wrap gap-2">{data.weekdayHours.map((item) => <span key={`${item.weekday}-${item.hour}`} className="rounded bg-muted px-2 py-1 text-xs">D{item.weekday} · {String(item.hour).padStart(2, "0")}h: {item.appointments}</span>)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
