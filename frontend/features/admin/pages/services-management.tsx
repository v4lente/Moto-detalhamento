import React, { useState } from "react";
import { TabsContent } from "@/shared/ui/tabs";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useOfferedServices, useOfferedServiceMutations, useServicePosts } from "../hooks/use-admin";
import type { OfferedService } from "@shared/contracts";
import { 
  Plus, Pencil, Trash2, Loader2, Wrench, Link as LinkIcon, ToggleLeft, ToggleRight 
} from "lucide-react";

export function ServicesManagementPage() {
  const [editingOfferedService, setEditingOfferedService] = useState<OfferedService | null>(null);
  const [isOfferedServiceDialogOpen, setIsOfferedServiceDialogOpen] = useState(false);

  const { data: offeredServices, isLoading: offeredServicesLoading } = useOfferedServices();
  const { data: servicePosts } = useServicePosts();
  const { createOfferedServiceMutation, updateOfferedServiceMutation, deleteOfferedServiceMutation } = useOfferedServiceMutations();

  return (
    <TabsContent value="offered-services" className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Serviços Prestados</h2>
        <Dialog open={isOfferedServiceDialogOpen} onOpenChange={(open) => {
          setIsOfferedServiceDialogOpen(open);
          if (!open) {
            setEditingOfferedService(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-black hover:bg-primary/90" data-testid="button-add-offered-service">
              <Plus className="h-4 w-4 mr-2" /> Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingOfferedService ? "Editar Serviço" : "Adicionar Serviço"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const exampleWorkValue = formData.get("exampleWorkId") as string;
                const serviceData = {
                  name: formData.get("name") as string,
                  details: formData.get("details") as string,
                  approximatePrice: formData.get("approximatePrice") ? parseFloat(formData.get("approximatePrice") as string) : null,
                  exampleWorkId: exampleWorkValue && exampleWorkValue !== "none" ? parseInt(exampleWorkValue) : null,
                  isActive: formData.get("isActive") === "on",
                };

                if (editingOfferedService) {
                  updateOfferedServiceMutation.mutate({
                    id: editingOfferedService.id,
                    data: serviceData,
                  }, {
                    onSuccess: () => {
                      setEditingOfferedService(null);
                      setIsOfferedServiceDialogOpen(false);
                    }
                  });
                } else {
                  createOfferedServiceMutation.mutate(serviceData, {
                    onSuccess: () => {
                      setIsOfferedServiceDialogOpen(false);
                    }
                  });
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Serviço *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingOfferedService?.name || ""}
                  placeholder="Ex: Polimento Técnico"
                  required
                  className="bg-background"
                  data-testid="input-offered-service-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="details">Detalhes do Serviço *</Label>
                <Textarea
                  id="details"
                  name="details"
                  defaultValue={editingOfferedService?.details || ""}
                  placeholder="Descreva o serviço oferecido..."
                  className="bg-background min-h-[100px]"
                  required
                  data-testid="input-offered-service-details"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="approximatePrice">Valor Aproximado (R$)</Label>
                <Input
                  id="approximatePrice"
                  name="approximatePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editingOfferedService?.approximatePrice || ""}
                  placeholder="Ex: 150.00"
                  className="bg-background"
                  data-testid="input-offered-service-price"
                />
                <p className="text-xs text-muted-foreground">O valor exato dependerá do estado atual da máquina</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exampleWorkId">Trabalho de Exemplo (Galeria)</Label>
                <Select 
                  name="exampleWorkId" 
                  defaultValue={editingOfferedService?.exampleWorkId?.toString() || "none"}
                >
                  <SelectTrigger className="bg-background" data-testid="select-example-work">
                    <SelectValue placeholder="Selecione um trabalho da galeria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {servicePosts?.map((post) => (
                      <SelectItem key={post.id} value={post.id.toString()}>
                        {post.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Link para um exemplo deste serviço na galeria</p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  defaultChecked={editingOfferedService?.isActive ?? true}
                  className="h-4 w-4 rounded border-gray-300"
                  data-testid="checkbox-offered-service-active"
                />
                <Label htmlFor="isActive">Serviço Ativo</Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-black hover:bg-primary/90"
                disabled={createOfferedServiceMutation.isPending || updateOfferedServiceMutation.isPending}
                data-testid="button-save-offered-service"
              >
                {(createOfferedServiceMutation.isPending || updateOfferedServiceMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingOfferedService ? "Salvar Alterações" : "Adicionar Serviço"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {offeredServicesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : offeredServices?.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
            <p className="text-sm text-muted-foreground/70 mt-2">Clique em "Novo Serviço" para adicionar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {offeredServices?.map((service) => (
            <Card key={service.id} className={`bg-card border-border ${!service.isActive ? 'opacity-60' : ''}`} data-testid={`card-offered-service-${service.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg truncate">{service.name}</h3>
                      {!service.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{service.details}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      {service.approximatePrice && (
                        <span className="text-primary font-bold">
                          A partir de R$ {service.approximatePrice.toFixed(2)}
                        </span>
                      )}
                      {service.exampleWorkId && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <LinkIcon className="h-3 w-3" />
                          Exemplo vinculado
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        updateOfferedServiceMutation.mutate({
                          id: service.id,
                          data: { isActive: !service.isActive },
                        });
                      }}
                      title={service.isActive ? "Desativar" : "Ativar"}
                      data-testid={`button-toggle-offered-service-${service.id}`}
                    >
                      {service.isActive ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setEditingOfferedService(service);
                        setIsOfferedServiceDialogOpen(true);
                      }}
                      data-testid={`button-edit-offered-service-${service.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        if (confirm("Tem certeza que deseja remover este serviço?")) {
                          deleteOfferedServiceMutation.mutate(service.id);
                        }
                      }}
                      data-testid={`button-delete-offered-service-${service.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </TabsContent>
  );
}

export default ServicesManagementPage;
