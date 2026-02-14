import React, { useState } from "react";
import { TabsContent } from "@/shared/ui/tabs";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useOrders, useOrderMutations } from "../hooks/use-admin";
import type { Order, OrderItem } from "@shared/contracts";
import { 
  ShoppingBag, Eye, Loader2, Clock, Check, X, Package, CheckCircle 
} from "lucide-react";

export function OrdersManagementPage() {
  const [selectedOrder, setSelectedOrder] = useState<(Order & { items: OrderItem[] }) | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { updateOrderStatusMutation, fetchOrderDetails } = useOrderMutations();

  const handleViewOrder = async (orderId: number) => {
    try {
      const orderDetails = await fetchOrderDetails(orderId);
      setSelectedOrder(orderDetails);
      setIsOrderDialogOpen(true);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <>
      <TabsContent value="orders" className="space-y-6">
        <h2 className="text-2xl font-display font-bold">Gerenciar Pedidos</h2>
        
        {ordersLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="bg-card border-border" data-testid={`admin-order-${order.id}`}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div>
                          <p className="font-bold text-sm sm:text-base">Pedido #{order.id}</p>
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
                          <SelectItem value="completed">
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" /> Concluído
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
              Detalhes do Pedido #{selectedOrder?.id}
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
                  <p className="font-medium">{selectedOrder.customerPhone}</p>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default OrdersManagementPage;
