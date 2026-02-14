import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { processCheckout, createStripeCheckoutSession, getCurrentCustomer, fetchSettings } from "@/shared/lib/api";
import { useCart } from "@/features/cart/lib/cart";
import { useToast } from "@/shared/hooks/use-toast";
import { isStripeAvailable, redirectToCheckout } from "@/shared/lib/stripe";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Phone, User, Mail, MapPin, Loader2, CreditCard, QrCode } from "lucide-react";
import { Link } from "wouter";

type PaymentMethod = "whatsapp" | "card" | "pix";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckoutDialog({ open, onOpenChange }: CheckoutDialogProps) {
  const { items, cartTotal, clearCart } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("whatsapp");

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

  // Check if Stripe is available on mount
  useEffect(() => {
    isStripeAvailable().then(setStripeEnabled);
  }, []);

  // WhatsApp checkout mutation
  const whatsappCheckoutMutation = useMutation({
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

  // Stripe checkout mutation
  const stripeCheckoutMutation = useMutation({
    mutationFn: createStripeCheckoutSession,
    onSuccess: async (result) => {
      try {
        // Redirect to Stripe Checkout using the checkout URL
        if (result.checkoutUrl) {
          await redirectToCheckout(result.checkoutUrl);
        } else {
          throw new Error("No checkout URL received");
        }
      } catch (error) {
        toast({ 
          title: "Erro", 
          description: "Falha ao redirecionar para o pagamento", 
          variant: "destructive" 
        });
      }
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

    const orderItems = items.map(item => ({
      productId: item.id,
      productName: item.variationLabel ? `${item.name} (${item.variationLabel})` : item.name,
      productPrice: item.price,
      quantity: item.quantity,
    }));

    if (paymentMethod === "whatsapp") {
      whatsappCheckoutMutation.mutate({
        customer: customerData,
        items: orderItems,
        total: cartTotal,
        paymentMethod: "whatsapp",
      });
    } else {
      // For card or pix, use Stripe
      stripeCheckoutMutation.mutate({
        customer: customerData,
        items: orderItems,
        total: cartTotal,
        paymentMethod: paymentMethod as "card" | "pix",
      });
    }
  };

  const isFormValid = customer || (formData.name.length >= 2 && formData.phone.length >= 10);
  const isPending = whatsappCheckoutMutation.isPending || stripeCheckoutMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
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
                <Label htmlFor="email">Email {paymentMethod !== "whatsapp" ? "*" : "(opcional)"}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="pl-10"
                    required={paymentMethod !== "whatsapp"}
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

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Forma de Pagamento</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              className="grid gap-2"
            >
              <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="whatsapp" id="whatsapp" />
                <Label htmlFor="whatsapp" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Phone className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Combinar pagamento via mensagem</p>
                  </div>
                </Label>
              </div>

              {stripeEnabled && (
                <>
                  <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">Cartão de Crédito/Débito</p>
                        <p className="text-xs text-muted-foreground">Visa, Mastercard, Elo, Hipercard</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer flex-1">
                      <QrCode className="h-4 w-4 text-teal-600" />
                      <div>
                        <p className="font-medium">PIX</p>
                        <p className="text-xs text-muted-foreground">Pagamento instantâneo</p>
                      </div>
                    </Label>
                  </div>
                </>
              )}
            </RadioGroup>
          </div>

          <div className="bg-background/50 rounded-lg p-4">
            <div className="flex justify-between font-bold">
              <span>Total do Pedido</span>
              <span className="text-primary" data-testid="text-checkout-total">R$ {cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <Button
            type="submit"
            className={`w-full font-bold ${
              paymentMethod === "whatsapp" 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-primary hover:bg-primary/90"
            } text-white`}
            disabled={!isFormValid || isPending || (paymentMethod !== "whatsapp" && !formData.email && !customer?.email)}
            data-testid="button-confirm-checkout"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : paymentMethod === "whatsapp" ? (
              <Phone className="mr-2 h-4 w-4" />
            ) : paymentMethod === "card" ? (
              <CreditCard className="mr-2 h-4 w-4" />
            ) : (
              <QrCode className="mr-2 h-4 w-4" />
            )}
            {paymentMethod === "whatsapp" 
              ? "Enviar Pedido pelo WhatsApp" 
              : paymentMethod === "card"
              ? "Pagar com Cartão"
              : "Pagar com PIX"
            }
          </Button>

          {paymentMethod !== "whatsapp" && (
            <p className="text-xs text-center text-muted-foreground">
              Você será redirecionado para uma página segura de pagamento
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
