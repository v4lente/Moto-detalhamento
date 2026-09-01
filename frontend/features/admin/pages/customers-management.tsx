import React, { useState } from "react";
import { TabsContent } from "@/shared/ui/tabs";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { useCustomers, useCustomerMutations } from "../hooks/use-admin";
import type { Customer } from "@shared/contracts";
import { CustomerDocumentFields, CustomerPhoneInput } from "@/shared/components/customer-fields";
import { formatPhoneBR } from "@/shared/lib/formatters";
import { 
  Plus, Pencil, Trash2, Loader2, Users, User, Phone, Mail, MapPin 
} from "lucide-react";

export function CustomersManagementPage() {
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);

  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { createCustomerMutation, updateCustomerMutation, deleteCustomerMutation } = useCustomerMutations();

  const handleCustomerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const address = {
      street: String(formData.get("address.street") || ""),
      number: String(formData.get("address.number") || ""),
      complement: String(formData.get("address.complement") || "") || null,
      neighborhood: String(formData.get("address.neighborhood") || ""),
      city: String(formData.get("address.city") || ""),
      state: String(formData.get("address.state") || ""),
      postalCode: String(formData.get("address.postalCode") || ""),
    };
    const hasAddress = Object.entries(address).some(([key, value]) => key !== "complement" && Boolean(value));
    const documentType = formData.get("documentType") as "cpf" | "cnpj" | null;
    const document = String(formData.get("document") || "");
    const identity = documentType && document ? { documentType, document } : {};

    if (editingCustomer) {
      const updateData = {
        name: String(formData.get("name") || ""),
        phone: String(formData.get("phone") || ""),
        email: String(formData.get("email") || "") || null,
        nickname: String(formData.get("nickname") || "") || null,
        deliveryAddress: String(formData.get("deliveryAddress") || "") || null,
        ...(hasAddress ? { address } : {}),
        ...identity,
      };
      updateCustomerMutation.mutate({ id: editingCustomer.id, data: updateData }, {
        onSuccess: () => {
          setEditingCustomer(null);
          setIsCustomerDialogOpen(false);
        }
      });
    } else {
      const createData = {
        name: String(formData.get("name") || ""),
        phone: String(formData.get("phone") || ""),
        email: String(formData.get("email") || ""),
        nickname: String(formData.get("nickname") || "") || undefined,
        password: String(formData.get("password") || ""),
        address,
        ...identity,
      } as Parameters<typeof createCustomerMutation.mutate>[0];
      createCustomerMutation.mutate(createData, {
        onSuccess: () => {
          setIsCustomerDialogOpen(false);
        }
      });
    }
  };

  return (
    <TabsContent value="customers" className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Gerenciar Clientes</h2>
        <Dialog open={isCustomerDialogOpen} onOpenChange={(open) => {
          setIsCustomerDialogOpen(open);
          if (!open) setEditingCustomer(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-black hover:bg-primary/90" data-testid="button-add-customer">
              <Plus className="h-4 w-4 mr-2" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary/20 w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingCustomer ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <form key={editingCustomer?.id || "new-customer"} onSubmit={handleCustomerSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="name" name="name" defaultValue={editingCustomer?.name} required className="pl-10" data-testid="input-customer-name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nickname">Apelido</Label>
                  <Input id="nickname" name="nickname" defaultValue={editingCustomer?.nickname || ""} data-testid="input-customer-nickname" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <CustomerPhoneInput id="phone" name="phone" defaultValue={editingCustomer?.phone || ""} required className="pl-10" data-testid="input-customer-phone" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" name="email" type="email" defaultValue={editingCustomer?.email || ""} required={!editingCustomer} className="pl-10" data-testid="input-customer-email" />
                  </div>
                </div>
              </div>
              <CustomerDocumentFields
                defaultDocumentType={editingCustomer?.documentType || "cpf"}
                defaultDocument=""
                maskedDocument={editingCustomer?.documentMasked || undefined}
                required={!editingCustomer}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              />
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Endereço de Entrega</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea id="deliveryAddress" name="deliveryAddress" defaultValue={editingCustomer?.deliveryAddress || ""} className="pl-10" data-testid="input-customer-address" />
                </div>
              </div>
              <div className="space-y-3 rounded-md border border-border/60 p-3">
                <Label>Endereço principal {!editingCustomer && "*"}</Label>
                <div className="grid grid-cols-[1fr_100px] gap-4">
                  <Input name="address.street" placeholder="Logradouro" defaultValue={editingCustomer?.address?.street || ""} required={!editingCustomer} />
                  <Input name="address.number" placeholder="Número" defaultValue={editingCustomer?.address?.number || ""} required={!editingCustomer} />
                </div>
                <Input name="address.complement" placeholder="Complemento (opcional)" defaultValue={editingCustomer?.address?.complement || ""} />
                <div className="grid grid-cols-2 gap-4">
                  <Input name="address.neighborhood" placeholder="Bairro" defaultValue={editingCustomer?.address?.neighborhood || ""} required={!editingCustomer} />
                  <Input name="address.postalCode" placeholder="CEP" defaultValue={editingCustomer?.address?.postalCode || ""} required={!editingCustomer} />
                </div>
                <div className="grid grid-cols-[1fr_70px] gap-4">
                  <Input name="address.city" placeholder="Cidade" defaultValue={editingCustomer?.address?.city || ""} required={!editingCustomer} />
                  <Input name="address.state" placeholder="UF" maxLength={2} defaultValue={editingCustomer?.address?.state || ""} required={!editingCustomer} />
                </div>
              </div>
              {!editingCustomer && (
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input id="password" name="password" type="password" minLength={8} required placeholder="Senha para acesso do cliente" data-testid="input-customer-password" />
                </div>
              )}
              <Button type="submit" className="w-full bg-primary text-black hover:bg-primary/90" data-testid="button-save-customer">
                {editingCustomer ? "Atualizar" : "Criar"} Cliente
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {customersLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : customers && customers.length > 0 ? (
        <div className="grid gap-4">
          {customers.map((customer) => (
            <Card key={customer.id} className="bg-card border-border" data-testid={`admin-customer-${customer.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 bg-background rounded-full flex items-center justify-center border border-border">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{customer.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatPhoneBR(customer.phone)} {customer.email && `• ${customer.email}`}
                  </p>
                  {customer.documentMasked && <p className="text-xs text-muted-foreground">{customer.documentType?.toUpperCase()}: {customer.documentMasked}</p>}
                  {customer.deliveryAddress && (
                    <p className="text-xs text-muted-foreground truncate max-w-md">{customer.deliveryAddress}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {customer.isRegistered && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-500">
                      Registrado
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setEditingCustomer(customer);
                      setIsCustomerDialogOpen(true);
                    }}
                    data-testid={`button-edit-customer-${customer.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteCustomerMutation.mutate(customer.id)}
                    data-testid={`button-delete-customer-${customer.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum cliente cadastrado ainda.</p>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}

export default CustomersManagementPage;
