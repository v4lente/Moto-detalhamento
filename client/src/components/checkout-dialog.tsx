import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { processCheckout, getCurrentCustomer, fetchSettings } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, User, Mail, MapPin, Loader2 } from "lucide-react";
import { Link } from "wouter";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckoutDialog({ open, onOpenChange }: CheckoutDialogProps) {
  const { items, cartTotal, clearCart } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customer } = useQuery({
    queryKey: ["customer"],
    queryFn: getCurrentCustomer,
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    nickname: "",
    deliveryAddress: "",
  });

  const checkoutMutation = useMutation({
    mutationFn: processCheckout,
    onSuccess: (result) => {
      const phoneNumber = settings?.whatsappNumber || "5511999999999";
      const encodedMessage = encodeURIComponent(result.whatsappMessage);
      window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, "_blank");
      
      clearCart();
      onOpenChange(false);
      toast({ title: "Pedido enviado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["customer"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const customerData = customer ? {
      name: customer.name,
      phone: customer.phone,
      email: customer.email || undefined,
      nickname: customer.nickname || undefined,
      deliveryAddress: customer.deliveryAddress || formData.deliveryAddress || undefined,
    } : {
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      nickname: formData.nickname || undefined,
      deliveryAddress: formData.deliveryAddress || undefined,
    };

    checkoutMutation.mutate({
      customer: customerData,
      items: items.map(item => ({
        productId: item.id,
        productName: item.name,
        productPrice: item.price,
        quantity: item.quantity,
      })),
      total: cartTotal,
    });
  };

  const isFormValid = customer || (formData.name.length >= 2 && formData.phone.length >= 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-widest text-primary">
            Finalizar Pedido
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {customer ? (
            <div className="bg-background/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">Logado como:</p>
              <p className="font-medium" data-testid="text-customer-name">{customer.name}</p>
              <p className="text-sm text-muted-foreground">{customer.phone}</p>
              {customer.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
              
              <div className="pt-2">
                <Label htmlFor="deliveryAddress">Endereço de Entrega</Label>
                <Textarea
                  id="deliveryAddress"
                  value={formData.deliveryAddress || customer.deliveryAddress || ""}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  placeholder="Rua, número, bairro, cidade..."
                  className="mt-1"
                  data-testid="input-delivery-address"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Seu nome completo"
                    className="pl-10"
                    required
                    data-testid="input-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="11999999999"
                    className="pl-10"
                    required
                    data-testid="input-phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (opcional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="pl-10"
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Endereço de Entrega (opcional)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    placeholder="Rua, número, bairro, cidade..."
                    className="pl-10"
                    data-testid="input-delivery-address"
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Já tem conta?{" "}
                <Link href="/conta" className="text-primary hover:underline" data-testid="link-customer-login">
                  Faça login
                </Link>
              </div>
            </>
          )}

          <div className="bg-background/50 rounded-lg p-4">
            <div className="flex justify-between font-bold">
              <span>Total do Pedido</span>
              <span className="text-primary" data-testid="text-checkout-total">R$ {cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
            disabled={!isFormValid || checkoutMutation.isPending}
            data-testid="button-confirm-checkout"
          >
            {checkoutMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Phone className="mr-2 h-4 w-4" />
            )}
            Enviar Pedido pelo WhatsApp
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
