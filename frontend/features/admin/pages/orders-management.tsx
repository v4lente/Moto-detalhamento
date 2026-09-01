import React, { useMemo, useState } from "react";
import { TabsContent } from "@/shared/ui/tabs";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useOrders, useOrderMutations, useUser } from "../hooks/use-admin";
import type { Order, OrderItem } from "@shared/contracts";
import type { CustomerData } from "@/shared/lib/api";
import { revealOrderCustomerDocument } from "@/shared/lib/api";
import { 
  ShoppingBag, Eye, Loader2, Clock, Check, X, Package, CheckCircle 
} from "lucide-react";
import { Input } from "@/shared/ui/input";
import { formatPhoneBR } from "@/shared/lib/formatters";

export function OrdersManagementPage() {
  const [selectedOrder, setSelectedOrder] = useState<(Order & { items: OrderItem[]; events?: Array<{ fromStatus: string | null; toStatus: string; actorType: string; createdAt: string }>; customer?: CustomerData | null }) | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [revealedDocument, setRevealedDocument] = useState<string | null>(null);
  const [revealedDocumentType, setRevealedDocumentType] = useState<"cpf" | "cnpj" | null>(null);
  const [isRevealingDocument, setIsRevealingDocument] = useState(false);
  const [fiscalError, setFiscalError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: currentUser } = useUser();
  const { updateOrderStatusMutation, fetchOrderDetails } = useOrderMutations();
  const canRevealDocument = currentUser?.role === "admin";
  const visibleOrders = useMemo(() => (orders || []).filter((order) => `${order.publicReference || ""} ${order.customerName} ${order.customerEmail || ""}`.toLowerCase().includes(search.toLowerCase())), [orders, search]);

  const handleViewOrder = async (orderId: number) => {
    try {
      const orderDetails = await fetchOrderDetails(orderId);
      setSelectedOrder(orderDetails);
      setIsOrderDialogOpen(true);
    } catch {
      // Error handled by mutation
    }
  };

  const handleRevealDocument = async () => {
    if (!selectedOrder) return;
    setIsRevealingDocument(true);
    setFiscalError(null);
    try {
      const result = await revealOrderCustomerDocument(selectedOrder.publicReference || String(selectedOrder.id));
      setRevealedDocument(result.document);
      setRevealedDocumentType(result.documentType);
    } catch (error) {
      setFiscalError(error instanceof Error ? error.message : "Não foi possível revelar o documento");
    } finally {
      setIsRevealingDocument(false);
    }
  };

  return (
    <>
      <TabsContent value="orders" className="space-y-6">
        <h2 className="text-2xl font-display font-bold">Gerenciar Pedidos</h2>
        <Input aria-label="Buscar pedidos" placeholder="Buscar por referência, cliente ou email" value={search} onChange={(event) => setSearch(event.target.value)} />
        
        {ordersLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : visibleOrders.length > 0 ? (
          <div className="space-y-4">
            {visibleOrders.map((order) => (
              <Card key={order.id} className="bg-card border-border" data-testid={`admin-order-${order.id}`}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div>
                          <p className="font-bold text-sm sm:text-base">Pedido #{order.publicReference || order.id}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="sm:hidden">
                          <p className="text-xs text-muted-foreground">Cliente: <span className="font-medium text-foreground">{order.customerName}</span></p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-sm text-muted-foreground">Cliente:</p>
                          <p className="font-medium">{order.customerName}</p>
                        </div>
                        {/* Payment Method Badge */}
                        <div className="flex items-center gap-2">
                          {order.paymentMethod === "card" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              💳 Cartão
                            </span>
                          )}
                          {order.paymentMethod === "pix" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
                              📱 PIX
                            </span>
                          )}
                          {(order.paymentMethod === "whatsapp" || !order.paymentMethod) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              📞 WhatsApp
                            </span>
                          )}
                          {/* Payment Status Badge */}
                          {order.paymentStatus === "paid" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              ✓ Pago
                            </span>
                          )}
                          {order.paymentStatus === "awaiting_payment" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                              ⏳ Aguardando
                            </span>
                          )}
                          {order.paymentStatus === "failed" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              ✗ Falhou
                            </span>
                          )}
                          {order.paymentStatus === "refunded" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                              ↩ Reembolsado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <div className="text-left sm:text-right">
                        <p className="font-bold text-primary text-sm sm:text-base">R$ {order.total.toFixed(2)}</p>
                      </div>
                      <Select
                        defaultValue={order.status}
                        onValueChange={(value) => updateOrderStatusMutation.mutate({ id: order.id, status: value })}
                      >
                        <SelectTrigger className="w-[100px] sm:w-[130px] text-xs sm:text-sm" data-testid={`select-status-${order.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-yellow-500" /> Pendente
                            </div>
                          </SelectItem>
                          <SelectItem value="awaiting_payment">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-orange-500" /> Aguard. Pgto
                            </div>
                          </SelectItem>
                          <SelectItem value="paid">
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" /> Pago
                            </div>
                          </SelectItem>
                          <SelectItem value="confirmed">
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-blue-500" /> Confirmado
                            </div>
                          </SelectItem>
                          <SelectItem value="shipped">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-purple-500" /> Enviado
                            </div>
                          </SelectItem>
                          <SelectItem value="delivered">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" /> Entregue
                            </div>
                          </SelectItem>
                          <SelectItem value="cancelled">
                            <div className="flex items-center gap-2">
                              <X className="h-4 w-4 text-red-500" /> Cancelado
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleViewOrder(order.id)}
                        data-testid={`button-view-order-${order.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum pedido recebido ainda.</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Order Details Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="bg-card border-primary/20 w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="font-display">
              Detalhes do Pedido #{selectedOrder?.publicReference || selectedOrder?.id}
            </DialogTitle>
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
                    <p className="text-muted-foreground">Email</p>
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
              {selectedOrder.customerId && selectedOrder.customer && (
                <Button type="button" variant="outline" className="w-full" onClick={() => {
                  setRevealedDocument(null);
                  setRevealedDocumentType(null);
                  setFiscalError(null);
                  setIsCustomerDialogOpen(true);
                }}>
                  Dados fiscais do cliente
                </Button>
              )}
              <div className="border-t border-border pt-4">
                <p className="font-medium mb-2">Itens do Pedido</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm" data-testid={`order-item-${item.id}`}>
                      <span>{item.quantity}x {item.productName}</span>
                      <span className="text-primary">R$ {(item.productPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold mt-4 pt-4 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">R$ {selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
              {selectedOrder.events && selectedOrder.events.length > 0 && <div className="border-t border-border pt-4"><p className="font-medium mb-2">Linha do tempo</p><div className="space-y-2 text-sm">{selectedOrder.events.map((event, index) => <div key={index} className="flex justify-between"><span>{event.fromStatus ? `${event.fromStatus} → ` : ""}{event.toStatus}</span><span className="text-muted-foreground">{new Date(event.createdAt).toLocaleString("pt-BR")}</span></div>)}</div></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isCustomerDialogOpen} onOpenChange={(open) => {
        setIsCustomerDialogOpen(open);
        if (!open) {
          setRevealedDocument(null);
          setRevealedDocumentType(null);
          setFiscalError(null);
        }
      }}>
        <DialogContent className="bg-card border-primary/20 w-[95vw] sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="font-display">Dados fiscais do cliente</DialogTitle>
          </DialogHeader>
          {selectedOrder?.customer ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0"><p className="text-muted-foreground">Nome</p><p className="font-medium break-words">{selectedOrder.customer.name}</p></div>
                <div className="min-w-0"><p className="text-muted-foreground">Telefone</p><p className="font-medium break-words">{formatPhoneBR(selectedOrder.customer.phone)}</p></div>
                <div className="min-w-0"><p className="text-muted-foreground">Email</p><p className="font-medium break-words">{selectedOrder.customer.email || "Não informado"}</p></div>
                <div className="min-w-0"><p className="text-muted-foreground">Documento</p><p className="font-medium break-words">{selectedOrder.customer.documentType?.toUpperCase()}: {selectedOrder.customer.documentMasked || "Não informado"}</p></div>
                {selectedOrder.customer.address && (
                  <div className="sm:col-span-2 min-w-0"><p className="text-muted-foreground">Endereço</p><p className="font-medium break-words">{selectedOrder.customer.address.street}, {selectedOrder.customer.address.number}, {selectedOrder.customer.address.neighborhood}, {selectedOrder.customer.address.city}/{selectedOrder.customer.address.state}, CEP {selectedOrder.customer.address.postalCode}</p></div>
                )}
              </div>
              {canRevealDocument ? (
                revealedDocument ? (
                  <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
                    <p className="text-muted-foreground">{revealedDocumentType?.toUpperCase()} completo</p>
                    <p className="font-mono font-bold" data-testid="revealed-customer-document">{revealedDocument}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Exibição temporária para emissão fiscal. Fechar esta janela apaga o valor.</p>
                  </div>
                ) : (
                  <Button type="button" onClick={handleRevealDocument} disabled={isRevealingDocument} className="w-full">
                    {isRevealingDocument ? "Carregando..." : "Exibir documento completo"}
                  </Button>
                )
              ) : (
                <p className="text-xs text-muted-foreground">A revelação do documento exige permissão de administrador.</p>
              )}
              {fiscalError && <p className="text-sm text-destructive">{fiscalError}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Cliente não localizado para este pedido.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default OrdersManagementPage;
