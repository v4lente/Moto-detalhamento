import React, { useState } from "react";
import { TabsContent } from "@/shared/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { DatePicker } from "@/shared/ui/date-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useOrders, useAppointments, useOrderMutations, useAppointmentMutations } from "../hooks/use-admin";
import type { Order, OrderItem, Appointment } from "@shared/contracts";
import { 
  ShoppingBag, Calendar, Eye, Search, ChevronLeft, ChevronRight, Loader2, 
  MessageCircle
} from "lucide-react";

const ITEMS_PER_PAGE = 5;

export function DashboardPage() {
  // Dashboard state
  const [dashboardOrderSearch, setDashboardOrderSearch] = useState("");
  const [dashboardOrderDateFilter, setDashboardOrderDateFilter] = useState("");
  const [dashboardOrderPage, setDashboardOrderPage] = useState(1);
  const [dashboardAppointmentSearch, setDashboardAppointmentSearch] = useState("");
  const [dashboardAppointmentDateFilter, setDashboardAppointmentDateFilter] = useState("");
  const [dashboardAppointmentPage, setDashboardAppointmentPage] = useState(1);
  
  // Dialog state
  const [selectedOrder, setSelectedOrder] = useState<(Order & { items: OrderItem[] }) | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);

  // Queries
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: appointments, isLoading: appointmentsLoading } = useAppointments();
  
  // Mutations
  const { updateOrderStatusMutation, fetchOrderDetails } = useOrderMutations();
  const { updateAppointmentMutation } = useAppointmentMutations();

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
      <TabsContent value="dashboard" className="space-y-6">
        <h2 className="text-2xl font-display font-bold">Dashboard</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Pedidos Recentes
              </CardTitle>
              <CardDescription>
                {orders?.length || 0} pedidos no total
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente..."
                    value={dashboardOrderSearch}
                    onChange={(e) => {
                      setDashboardOrderSearch(e.target.value);
                      setDashboardOrderPage(1);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setDashboardOrderPage(1);
                      }
                    }}
                    className="pl-9"
                    data-testid="input-dashboard-order-search"
                  />
                </div>
                <DatePicker
                  value={dashboardOrderDateFilter ? new Date(dashboardOrderDateFilter + 'T12:00:00') : undefined}
                  onChange={(date) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      setDashboardOrderDateFilter(`${year}-${month}-${day}`);
                    } else {
                      setDashboardOrderDateFilter('');
                    }
                    setDashboardOrderPage(1);
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
              ) : (() => {
                const filteredOrders = (orders || []).filter(order => {
                  const matchesSearch = !dashboardOrderSearch || 
                    order.customerName.toLowerCase().includes(dashboardOrderSearch.toLowerCase());
                  const matchesDate = !dashboardOrderDateFilter || 
                    new Date(order.createdAt).toISOString().slice(0, 10) === dashboardOrderDateFilter;
                  return matchesSearch && matchesDate;
                });
                const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
                const paginatedOrders = filteredOrders.slice(
                  (dashboardOrderPage - 1) * ITEMS_PER_PAGE,
                  dashboardOrderPage * ITEMS_PER_PAGE
                );
                
                return (
                  <>
                    {paginatedOrders.length > 0 ? (
                      <div className="space-y-2">
                        {paginatedOrders.map((order) => (
                          <div 
                            key={order.id} 
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" 
                            onClick={() => handleViewOrder(order.id)}
                            data-testid={`dashboard-order-${order.id}`}
                          >
                            <div className="flex-1">
                              <p className="font-medium">{order.customerName}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString('pt-BR')} - R$ {(order.total / 100).toFixed(2).replace('.', ',')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                order.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                order.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                                'bg-yellow-500/20 text-yellow-500'
                              }`}>
                                {order.status === 'pending' ? 'Pendente' : 
                                 order.status === 'completed' ? 'Concluído' : 'Cancelado'}
                              </span>
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">Nenhum pedido encontrado</p>
                    )}
                    
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                          Página {dashboardOrderPage} de {totalPages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDashboardOrderPage(p => Math.max(1, p - 1))}
                            disabled={dashboardOrderPage === 1}
                            data-testid="button-dashboard-order-prev"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDashboardOrderPage(p => Math.min(totalPages, p + 1))}
                            disabled={dashboardOrderPage === totalPages}
                            data-testid="button-dashboard-order-next"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Appointments Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Pré-Agendamentos
              </CardTitle>
              <CardDescription>
                {appointments?.filter(a => a.status === 'pre_agendamento').length || 0} aguardando análise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente..."
                    value={dashboardAppointmentSearch}
                    onChange={(e) => {
                      setDashboardAppointmentSearch(e.target.value);
                      setDashboardAppointmentPage(1);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setDashboardAppointmentPage(1);
                      }
                    }}
                    className="pl-9"
                    data-testid="input-dashboard-appointment-search"
                  />
                </div>
                <DatePicker
                  value={dashboardAppointmentDateFilter ? new Date(dashboardAppointmentDateFilter + 'T12:00:00') : undefined}
                  onChange={(date) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      setDashboardAppointmentDateFilter(`${year}-${month}-${day}`);
                    } else {
                      setDashboardAppointmentDateFilter('');
                    }
                    setDashboardAppointmentPage(1);
                  }}
                  placeholder="Filtrar por data"
                  className="w-44"
                  data-testid="input-dashboard-appointment-date"
                />
              </div>
              
              {appointmentsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (() => {
                const filteredAppointments = (appointments || []).filter(apt => {
                  const matchesSearch = !dashboardAppointmentSearch || 
                    (apt.customerName || '').toLowerCase().includes(dashboardAppointmentSearch.toLowerCase()) ||
                    apt.vehicleInfo.toLowerCase().includes(dashboardAppointmentSearch.toLowerCase());
                  const matchesDate = !dashboardAppointmentDateFilter || 
                    new Date(apt.preferredDate).toISOString().slice(0, 10) === dashboardAppointmentDateFilter;
                  return matchesSearch && matchesDate;
                });
                const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);
                const paginatedAppointments = filteredAppointments.slice(
                  (dashboardAppointmentPage - 1) * ITEMS_PER_PAGE,
                  dashboardAppointmentPage * ITEMS_PER_PAGE
                );
                
                const statusConfig: Record<string, { label: string; color: string }> = {
                  pre_agendamento: { label: "Pré-agendamento", color: "bg-yellow-500/20 text-yellow-500" },
                  agendado_nao_iniciado: { label: "Agendado", color: "bg-blue-500/20 text-blue-500" },
                  em_andamento: { label: "Em andamento", color: "bg-orange-500/20 text-orange-500" },
                  concluido: { label: "Concluído", color: "bg-green-500/20 text-green-500" },
                  cancelado: { label: "Cancelado", color: "bg-red-500/20 text-red-500" },
                };
                
                return (
                  <>
                    {paginatedAppointments.length > 0 ? (
                      <div className="space-y-2">
                        {paginatedAppointments.map((apt) => {
                          const status = statusConfig[apt.status] || statusConfig.pre_agendamento;
                          return (
                            <div 
                              key={apt.id} 
                              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" 
                              onClick={() => {
                                setEditingAppointment(apt);
                                setIsAppointmentDialogOpen(true);
                              }}
                              data-testid={`dashboard-appointment-${apt.id}`}
                            >
                              <div className="flex-1">
                                <p className="font-medium">{apt.customerName || 'Cliente logado'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {apt.vehicleInfo} - {new Date(apt.preferredDate).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                                  {status.label}
                                </span>
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">Nenhum agendamento encontrado</p>
                    )}
                    
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                          Página {dashboardAppointmentPage} de {totalPages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDashboardAppointmentPage(p => Math.max(1, p - 1))}
                            disabled={dashboardAppointmentPage === 1}
                            data-testid="button-dashboard-appointment-prev"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDashboardAppointmentPage(p => Math.min(totalPages, p + 1))}
                            disabled={dashboardAppointmentPage === totalPages}
                            data-testid="button-dashboard-appointment-next"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Order Dialog */}
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

      {/* Appointment Dialog */}
      <Dialog open={isAppointmentDialogOpen && editingAppointment !== null} onOpenChange={(open) => {
        setIsAppointmentDialogOpen(open);
        if (!open) setEditingAppointment(null);
      }}>
        <DialogContent className="bg-card border-primary/20 w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="font-display">Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          {editingAppointment && (
            <form key={`standalone-form-appointment-${editingAppointment.id}`} onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const confirmedDateStr = formData.get("confirmedDate") as string;
              const estimatedPriceStr = formData.get("estimatedPrice") as string;
              
              updateAppointmentMutation.mutate({
                id: editingAppointment.id,
                data: {
                  status: formData.get("status") as "pre_agendamento" | "agendado_nao_iniciado" | "em_andamento" | "concluido" | "cancelado",
                  confirmedDate: confirmedDateStr || undefined,
                  estimatedPrice: estimatedPriceStr ? Math.round(parseFloat(estimatedPriceStr) * 100) : undefined,
                  adminNotes: formData.get("adminNotes") as string || undefined,
                }
              }, {
                onSuccess: () => {
                  setIsAppointmentDialogOpen(false);
                  setEditingAppointment(null);
                }
              });
            }} className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                <p className="text-sm"><strong>Cliente:</strong> {editingAppointment.customerName || 'Cliente logado'}</p>
                {editingAppointment.customerPhone && (
                  <p className="text-sm"><strong>Telefone:</strong> {editingAppointment.customerPhone}</p>
                )}
                <p className="text-sm"><strong>Veículo:</strong> {editingAppointment.vehicleInfo}</p>
                <p className="text-sm"><strong>Serviço:</strong> {editingAppointment.serviceDescription}</p>
                <p className="text-sm"><strong>Data Preferencial:</strong> {new Date(editingAppointment.preferredDate).toLocaleString('pt-BR')}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue={editingAppointment.status}>
                  <SelectTrigger data-testid="select-standalone-appointment-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre_agendamento">Pré-agendamento</SelectItem>
                    <SelectItem value="agendado_nao_iniciado">Agendado (não iniciado)</SelectItem>
                    <SelectItem value="em_andamento">Em andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmedDate">Data Confirmada</Label>
                <Input
                  type="datetime-local"
                  name="confirmedDate"
                  defaultValue={editingAppointment.confirmedDate ? new Date(editingAppointment.confirmedDate).toISOString().slice(0, 16) : ""}
                  data-testid="input-standalone-confirmed-date"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="estimatedPrice">Preço Estimado (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  name="estimatedPrice"
                  defaultValue={editingAppointment.estimatedPrice ? (Number(editingAppointment.estimatedPrice) / 100).toFixed(2) : ""}
                  placeholder="0.00"
                  data-testid="input-standalone-estimated-price"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminNotes">Notas Internas</Label>
                <Textarea
                  name="adminNotes"
                  defaultValue={editingAppointment.adminNotes || ""}
                  placeholder="Observações internas (não visível para o cliente)"
                  rows={3}
                  data-testid="input-standalone-admin-notes"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-primary text-black hover:bg-primary/90" disabled={updateAppointmentMutation.isPending} data-testid="button-standalone-save-appointment">
                  {updateAppointmentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </Button>
                {editingAppointment.customerPhone && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-green-500 text-green-500 hover:bg-green-500/10"
                    asChild
                  >
                    <a
                      href={`https://wa.me/${editingAppointment.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá ${editingAppointment.customerName || 'Cliente'}!\n\n` +
                        `Sobre seu agendamento de serviço:\n\n` +
                        `🏍️ Veículo: ${editingAppointment.vehicleInfo}\n` +
                        `📅 Data Solicitada: ${new Date(editingAppointment.preferredDate).toLocaleDateString('pt-BR')}\n` +
                        `📋 Status: ${
                          editingAppointment.status === 'pre_agendamento' ? 'Pré-agendamento' :
                          editingAppointment.status === 'agendado_nao_iniciado' ? 'Agendado' :
                          editingAppointment.status === 'em_andamento' ? 'Em andamento' :
                          editingAppointment.status === 'concluido' ? 'Concluído' :
                          editingAppointment.status === 'cancelado' ? 'Cancelado' : editingAppointment.status
                        }\n` +
                        (editingAppointment.confirmedDate ? `✅ Data Confirmada: ${new Date(editingAppointment.confirmedDate).toLocaleDateString('pt-BR')}\n` : '') +
                        (editingAppointment.estimatedPrice ? `💰 Preço Estimado: R$ ${editingAppointment.estimatedPrice.toFixed(2)}\n` : '') +
                        (editingAppointment.adminNotes ? `📝 Observações: ${editingAppointment.adminNotes}\n` : '') +
                        `\nDaniel Valente Moto Detalhamento`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="link-standalone-whatsapp-appointment"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DashboardPage;
