import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Eye, Loader2, RefreshCw, Search, ShoppingBag } from "lucide-react";
import { TabsContent } from "@/shared/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { DatePicker } from "@/shared/ui/date-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { useAppointmentSummary, useDashboardAnalytics, useOrdersPage, useOrderMutations } from "../hooks/use-admin";
import type { Order, OrderItem } from "@shared/contracts";
import { formatCurrencyBRL, formatOrderItemName, formatPhoneBR } from "@/shared/lib/formatters";
import { SalesAnalytics } from "../components/sales-analytics";
import { ServiceAnalytics } from "../components/service-analytics";

const ITEMS_PER_PAGE = 5;

function formatCivilDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function defaultAnalyticsFrom() {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return formatCivilDate(date);
}

function formatAppointmentDate(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

interface DashboardPageProps {
  onOpenAgenda?: () => void;
}

export function DashboardPage({ onOpenAgenda }: DashboardPageProps) {
  const [orderSearch, setOrderSearch] = useState("");
  const [orderDateFilter, setOrderDateFilter] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { items: OrderItem[] }) | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [analyticsFrom, setAnalyticsFrom] = useState(defaultAnalyticsFrom);
  const [analyticsTo, setAnalyticsTo] = useState(() => formatCivilDate(new Date()));

  const { data: ordersPage, isLoading: ordersLoading } = useOrdersPage({
    page: orderPage,
    pageSize: ITEMS_PER_PAGE,
    q: orderSearch.trim() || undefined,
    from: orderDateFilter ? `${orderDateFilter}T00:00:00-03:00` : undefined,
    to: orderDateFilter ? `${orderDateFilter}T23:59:59-03:00` : undefined,
  });
  const { data: agendaSummary, isLoading: agendaLoading } = useAppointmentSummary();
  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError, refetch: refetchAnalytics } = useDashboardAnalytics({ from: analyticsFrom, to: analyticsTo });
  const { fetchOrderDetails } = useOrderMutations();

  const handleViewOrder = async (orderId: number) => {
    try {
      setSelectedOrder(await fetchOrderDetails(orderId));
      setIsOrderDialogOpen(true);
    } catch {
      // The shared request layer reports the error.
    }
  };

  const orders = ordersPage?.items || [];
  const totalOrderPages = ordersPage?.totalPages || 0;

  return (
    <>
      <TabsContent value="dashboard" className="space-y-6">
        <h2 className="text-2xl font-display font-bold">Dashboard</h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Pedidos Recentes
              </CardTitle>
              <CardDescription>{ordersPage?.total || 0} pedidos no total</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente..."
                    value={orderSearch}
                    onChange={(event) => {
                      setOrderSearch(event.target.value);
                      setOrderPage(1);
                    }}
                    className="pl-9"
                    data-testid="input-dashboard-order-search"
                  />
                </div>
                <DatePicker
                  value={orderDateFilter ? new Date(`${orderDateFilter}T12:00:00`) : undefined}
                  onChange={(date) => {
                    setOrderDateFilter(date
                      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                      : "");
                    setOrderPage(1);
                  }}
                  placeholder="Filtrar por data"
                  className="w-44"
                  data-testid="input-dashboard-order-date"
                />
              </div>

              {ordersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <button
                      type="button"
                      key={order.id}
                      className="flex w-full items-center justify-between rounded-lg bg-muted/30 p-3 text-left transition-colors hover:bg-muted/50"
                      onClick={() => handleViewOrder(order.id)}
                      data-testid={`dashboard-order-${order.id}`}
                    >
                      <span>
                        <span className="block font-medium">{order.customerName}</span>
                        <span className="block text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR")} - {formatCurrencyBRL(order.total)}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className={`rounded px-2 py-1 text-xs font-medium ${
                          order.status === "completed"
                            ? "bg-green-500/20 text-green-500"
                            : order.status === "cancelled"
                              ? "bg-red-500/20 text-red-500"
                              : "bg-yellow-500/20 text-yellow-500"
                        }`}>
                          {order.status === "pending" ? "Pendente" : order.status === "completed" ? "Concluído" : "Cancelado"}
                        </span>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-muted-foreground">Nenhum pedido encontrado</p>
              )}

              {totalOrderPages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">Página {orderPage} de {totalOrderPages}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrderPage((page) => Math.max(1, page - 1))}
                      disabled={orderPage === 1}
                      data-testid="button-dashboard-order-prev"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrderPage((page) => Math.min(totalOrderPages, page + 1))}
                      disabled={orderPage === totalOrderPages}
                      data-testid="button-dashboard-order-next"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border" data-testid="dashboard-agenda-summary">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Resumo da Agenda
                  </CardTitle>
                  <CardDescription>Visão rápida da operação; a gestão fica na aba Agenda.</CardDescription>
                </div>
                <Button size="sm" onClick={onOpenAgenda} data-testid="button-open-agenda">
                  Abrir Agenda
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {agendaLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-muted/40 p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{agendaSummary?.today || 0}</p>
                      <p className="text-xs text-muted-foreground">Hoje</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3 text-center">
                      <p className="text-2xl font-bold text-blue-400">{agendaSummary?.notStarted || 0}</p>
                      <p className="text-xs text-muted-foreground">Não iniciados</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3 text-center">
                      <p className="text-2xl font-bold text-amber-400">{agendaSummary?.inProgress || 0}</p>
                      <p className="text-xs text-muted-foreground">Em andamento</p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium">Próximos agendamentos</p>
                    {agendaSummary?.upcoming.length ? (
                      <div className="space-y-2">
                        {agendaSummary.upcoming.map((appointment) => (
                          <button
                            type="button"
                            key={appointment.id}
                            onClick={onOpenAgenda}
                            className="flex w-full justify-between rounded-lg bg-muted/30 p-3 text-left hover:bg-muted/50"
                          >
                            <span>
                              <span className="block font-medium">{appointment.customerName}</span>
                              <span className="block text-xs text-muted-foreground">{appointment.vehicleInfo}</span>
                            </span>
                            <span className="text-right text-xs text-muted-foreground">
                              {formatAppointmentDate(appointment.startAt)}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-lg bg-muted/20 p-4 text-center text-sm text-muted-foreground">
                        Nenhum agendamento futuro.
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4" aria-labelledby="analytics-heading">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h3 id="analytics-heading" className="text-xl font-display font-bold">Análises de vendas e serviços</h3>
              <p className="text-sm text-muted-foreground">Datas civis no fuso de São Paulo; valores de produtos não representam fluxo de caixa por data de recebimento.</p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs text-muted-foreground">De<Input type="date" value={analyticsFrom} onChange={(event) => setAnalyticsFrom(event.target.value)} className="mt-1" /></label>
              <label className="text-xs text-muted-foreground">Até<Input type="date" value={analyticsTo} onChange={(event) => setAnalyticsTo(event.target.value)} className="mt-1" /></label>
            </div>
          </div>

          {analyticsLoading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
            : analyticsError ? <div className="rounded-lg border border-destructive/40 p-6 text-center text-sm text-destructive">Não foi possível carregar as análises. <Button variant="link" onClick={() => void refetchAnalytics()}><RefreshCw className="mr-1 h-4 w-4" />Tentar novamente</Button></div>
              : analytics ? <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pedidos vendidos</p><p className="text-2xl font-bold">{analytics.products.soldOrders}</p></CardContent></Card>
                  <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Valor vendido</p><p className="text-2xl font-bold">{formatCurrencyBRL(analytics.products.soldOrderValueCents / 100)}</p></CardContent></Card>
                  <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Serviços concluídos pagos</p><p className="text-2xl font-bold">{analytics.services.completedPaid}</p></CardContent></Card>
                  <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Serviços concluídos não pagos</p><p className="text-2xl font-bold">{analytics.services.completedUnpaid}</p></CardContent></Card>
                </div>
                <div className="grid gap-6 xl:grid-cols-2"><SalesAnalytics data={analytics.products} /><ServiceAnalytics data={analytics.services} /></div>
              </> : null}
        </section>
      </TabsContent>

      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto border-primary/20 bg-card sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="font-display">Detalhes do Pedido #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefone</p>
                  <p className="font-medium">{formatPhoneBR(selectedOrder.customerPhone)}</p>
                </div>
                {selectedOrder.customerEmail && (
                  <div>
                    <p className="text-muted-foreground">E-mail</p>
                    <p className="font-medium">{selectedOrder.customerEmail}</p>
                  </div>
                )}
                {selectedOrder.deliveryAddress && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Endereço</p>
                    <p className="font-medium">{selectedOrder.deliveryAddress}</p>
                  </div>
                )}
              </div>
              <div className="border-t border-border pt-4">
                <p className="mb-2 font-medium">Itens do Pedido</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm" data-testid={`order-item-${item.id}`}>
                      <span className="min-w-0 break-words pr-3">{item.quantity}x {formatOrderItemName(item.productName, item.variationLabel)}</span>
                      <span className="shrink-0 text-primary">{formatCurrencyBRL(item.productPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between border-t border-border pt-4 font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrencyBRL(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DashboardPage;
