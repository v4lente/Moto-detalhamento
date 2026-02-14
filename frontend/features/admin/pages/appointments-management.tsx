import React, { useState } from "react";
import { TabsContent } from "@/shared/ui/tabs";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useAppointments, useAppointmentMutations } from "../hooks/use-admin";
import type { Appointment } from "@shared/contracts";
import { 
  Pencil, Trash2, Loader2, Calendar, User, Phone, Clock, Play,
  AlertTriangle, CheckCircle, XCircle, MessageCircle
} from "lucide-react";

export function AppointmentsManagementPage() {
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);

  const { data: appointments, isLoading: appointmentsLoading } = useAppointments();
  const { updateAppointmentMutation, deleteAppointmentMutation } = useAppointmentMutations();

  return (
    <TabsContent value="appointments" className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Gerenciar Agendamentos</h2>
      </div>

      {appointmentsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : appointments && appointments.length > 0 ? (
        <div className="space-y-4">
          {appointments.map((appointment) => {
            const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
              pre_agendamento: { label: "Pré-agendamento", color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30", icon: AlertTriangle },
              agendado_nao_iniciado: { label: "Agendado", color: "bg-blue-500/20 text-blue-500 border-blue-500/30", icon: Clock },
              em_andamento: { label: "Em andamento", color: "bg-orange-500/20 text-orange-500 border-orange-500/30", icon: Play },
              concluido: { label: "Concluído", color: "bg-green-500/20 text-green-500 border-green-500/30", icon: CheckCircle },
              cancelado: { label: "Cancelado", color: "bg-red-500/20 text-red-500 border-red-500/30", icon: XCircle },
            };
            const status = statusConfig[appointment.status] || statusConfig.pre_agendamento;
            const StatusIcon = status.icon;
            
            return (
              <Card key={appointment.id} className="bg-card border-border" data-testid={`appointment-card-${appointment.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ID: #{appointment.id}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold">{appointment.vehicleInfo}</h3>
                      <p className="text-sm text-muted-foreground">{appointment.serviceDescription}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{appointment.customerName || "Cliente logado"}</span>
                        </div>
                        {appointment.customerPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{appointment.customerPhone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Preferência: {new Date(appointment.preferredDate).toLocaleString("pt-BR")}</span>
                        </div>
                        {appointment.confirmedDate && (
                          <div className="flex items-center gap-2 text-primary">
                            <Calendar className="h-4 w-4" />
                            <span>Confirmado: {new Date(appointment.confirmedDate).toLocaleString("pt-BR")}</span>
                          </div>
                        )}
                        {appointment.estimatedPrice && (
                          <div className="flex items-center gap-2 text-primary font-semibold">
                            R$ {(Number(appointment.estimatedPrice) / 100).toFixed(2).replace(".", ",")}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Dialog open={isAppointmentDialogOpen && editingAppointment?.id === appointment.id} onOpenChange={(open) => {
                        setIsAppointmentDialogOpen(open);
                        if (!open) setEditingAppointment(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingAppointment(appointment);
                              setIsAppointmentDialogOpen(true);
                            }}
                            data-testid={`button-edit-appointment-${appointment.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-primary/20 w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
                          <DialogHeader>
                            <DialogTitle className="font-display">Atualizar Agendamento</DialogTitle>
                          </DialogHeader>
                          <form key={`form-appointment-${appointment.id}`} onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const confirmedDateStr = formData.get("confirmedDate") as string;
                            const estimatedPriceStr = formData.get("estimatedPrice") as string;
                            
                            updateAppointmentMutation.mutate({
                              id: appointment.id,
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
                            <div className="space-y-2">
                              <Label>Status</Label>
                              <Select name="status" defaultValue={appointment.status}>
                                <SelectTrigger data-testid={`select-appointment-status-${appointment.id}`}>
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
                                defaultValue={appointment.confirmedDate ? new Date(appointment.confirmedDate).toISOString().slice(0, 16) : ""}
                                data-testid={`input-confirmed-date-${appointment.id}`}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="estimatedPrice">Preço Estimado (R$)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                name="estimatedPrice"
                                defaultValue={appointment.estimatedPrice ? (Number(appointment.estimatedPrice) / 100).toFixed(2) : ""}
                                placeholder="0.00"
                                data-testid={`input-estimated-price-${appointment.id}`}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="adminNotes">Notas Internas</Label>
                              <Textarea
                                name="adminNotes"
                                defaultValue={appointment.adminNotes || ""}
                                placeholder="Observações internas (não visível para o cliente)"
                                rows={3}
                                data-testid={`input-admin-notes-${appointment.id}`}
                              />
                            </div>
                            
                            <div className="flex gap-2 pt-4">
                              <Button type="submit" className="flex-1 bg-primary text-black hover:bg-primary/90" disabled={updateAppointmentMutation.isPending} data-testid={`button-save-appointment-${appointment.id}`}>
                                {updateAppointmentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                              </Button>
                              {appointment.customerPhone && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="border-green-500 text-green-500 hover:bg-green-500/10"
                                  asChild
                                >
                                  <a
                                    href={`https://wa.me/${appointment.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                      `Olá ${appointment.customerName || 'Cliente'}!\n\n` +
                                      `Sobre seu agendamento de serviço:\n\n` +
                                      `🏍️ Veículo: ${appointment.vehicleInfo}\n` +
                                      `📅 Data Solicitada: ${new Date(appointment.preferredDate).toLocaleDateString('pt-BR')}\n` +
                                      `📋 Status: ${
                                        appointment.status === 'pre_agendamento' ? 'Pré-agendamento' :
                                        appointment.status === 'agendado_nao_iniciado' ? 'Agendado' :
                                        appointment.status === 'em_andamento' ? 'Em andamento' :
                                        appointment.status === 'concluido' ? 'Concluído' :
                                        appointment.status === 'cancelado' ? 'Cancelado' : appointment.status
                                      }\n` +
                                      (appointment.confirmedDate ? `✅ Data Confirmada: ${new Date(appointment.confirmedDate).toLocaleDateString('pt-BR')}\n` : '') +
                                      (appointment.estimatedPrice ? `💰 Preço Estimado: R$ ${appointment.estimatedPrice.toFixed(2)}\n` : '') +
                                      (appointment.adminNotes ? `📝 Observações: ${appointment.adminNotes}\n` : '') +
                                      `\nDaniel Valente Moto Detalhamento`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    data-testid={`link-whatsapp-appointment-${appointment.id}`}
                                  >
                                    <MessageCircle className="h-4 w-4 mr-1" />
                                    WhatsApp
                                  </a>
                                </Button>
                              )}
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja remover este agendamento?")) {
                            deleteAppointmentMutation.mutate(appointment.id);
                          }
                        }}
                        data-testid={`button-delete-appointment-${appointment.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum agendamento encontrado.</p>
            <p className="text-sm text-muted-foreground mt-2">Os pedidos de agendamento dos clientes aparecerão aqui.</p>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}

export default AppointmentsManagementPage;
