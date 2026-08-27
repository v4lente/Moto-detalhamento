import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createStripeCheckoutSession, getCurrentCustomer, fetchSettings } from "@/shared/lib/api";
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
import {
  CheckCircle2,
  Phone,
  User,
  Mail,
  MapPin,
  Loader2,
  CreditCard,
  QrCode,
} from "lucide-react";
import { Link } from "wouter";

type PaymentMethod = "whatsapp" | "card" | "pix";
type CheckoutStep = "form" | "whatsapp" | "success";

type CustomerData = {
  name: string;
  phone: string;
  email?: string;
  nickname?: string;
  deliveryAddress?: string;
};

type OrderItemData = {
  productName: string;
  productPrice: number;
  quantity: number;
};

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckoutDialog({ open, onOpenChange }: CheckoutDialogProps) {
  const { items, cartTotal, clearCart } = useCart();
  const { toast } = useToast();

  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("whatsapp");
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("form");
  const [whatsappUrl, setWhatsappUrl] = useState("");

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

  useEffect(() => {
    if (!customer?.deliveryAddress) return;

    setFormData((current) =>
      current.deliveryAddress
        ? current
        : { ...current, deliveryAddress: customer.deliveryAddress || "" }
    );
  }, [customer?.deliveryAddress]);

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

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;

  const buildWhatsAppMessage = (customerData: CustomerData, orderItems: OrderItemData[]) => {
    const itemsList = orderItems
      .map(
        (item) =>
          `- ${item.quantity}x ${item.productName} - ${formatCurrency(item.productPrice * item.quantity)}`
      )
      .join("\n");

    return [
      "*Novo Pedido*",
      "",
      `*Cliente:* ${customerData.name}`,
      customerData.email ? `*Email:* ${customerData.email}` : null,
      customerData.deliveryAddress ? `*Endereço:* ${customerData.deliveryAddress}` : null,
      "",
      "*Itens:*",
      itemsList,
      "",
      `*Total: ${formatCurrency(cartTotal)}*`,
    ]
      .filter((line): line is string => line !== null)
      .join("\n");
  };

  const sendWhatsAppOrder = (customerData: CustomerData, orderItems: OrderItemData[]) => {
    const phoneNumber = (settings?.whatsappNumber || "5511999999999").replace(/\D/g, "");
    const encodedMessage = encodeURIComponent(buildWhatsAppMessage(customerData, orderItems));
    const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    setWhatsappUrl(url);
    setCheckoutStep("whatsapp");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleWhatsAppSent = () => {
    clearCart();
    setCheckoutStep("success");
  };

  const resetCheckout = () => {
    setCheckoutStep("form");
    setWhatsappUrl("");
    setFormData({
      name: "",
      phone: "",
      email: "",
      nickname: "",
      deliveryAddress: customer?.deliveryAddress || "",
    });
  };

  const handleSuccessClose = () => {
    resetCheckout();
    onOpenChange(false);
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && checkoutStep === "success") {
      resetCheckout();
    } else if (!nextOpen && checkoutStep === "whatsapp") {
      setCheckoutStep("form");
      setWhatsappUrl("");
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const customerData = customer ? {
      name: customer.name,
      phone: customer.phone,
      email: customer.email || undefined,
      nickname: customer.nickname || undefined,
      deliveryAddress: formData.deliveryAddress.trim() || undefined,
    } : {
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      nickname: formData.nickname || undefined,
      deliveryAddress: formData.deliveryAddress.trim() || undefined,
    };

    const orderItems = items.map(item => ({
      productId: item.id,
      productName: item.variationLabel ? `${item.name} (${item.variationLabel})` : item.name,
      productPrice: item.price,
      quantity: item.quantity,
    }));

    if (paymentMethod === "whatsapp") {
      sendWhatsAppOrder(customerData, orderItems);
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

  const hasCustomerName = customer || formData.name.trim().length >= 2;
  const hasCustomerPhone = customer || formData.phone.replace(/\D/g, "").length >= 10;
  const hasPaymentContact = customer || Boolean(formData.email);
  const isFormValid = paymentMethod === "whatsapp"
    ? hasCustomerName
    : hasCustomerName && hasCustomerPhone && hasPaymentContact;
  const isPending = stripeCheckoutMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
        {checkoutStep === "form" && (
          <>
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

              {paymentMethod !== "whatsapp" && (
                <>
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
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="seu@email.com"
                        className="pl-10"
                        required
                        data-testid="input-email"
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
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="deliveryAddress">Endereço para entrega (opcional)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                placeholder="Rua, número, bairro, cidade, estado e CEP"
                className="pl-10"
                maxLength={300}
                data-testid="input-delivery-address"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Se preferir, você poderá informar o endereço durante o atendimento.
            </p>
          </div>

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
            disabled={!isFormValid || isPending}
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
              ? "Continuar para o WhatsApp"
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
          </>
        )}

        {checkoutStep === "whatsapp" && (
          <div className="space-y-5" data-testid="whatsapp-confirmation-step">
            <DialogHeader>
              <DialogTitle className="font-display uppercase tracking-widest text-primary">
                Finalize no WhatsApp
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-green-600/15 p-3">
                <Phone className="h-7 w-7 text-green-600" />
              </div>
              <div className="space-y-2">
                <p className="font-semibold">Seu pedido está pronto para ser enviado.</p>
                <p className="text-sm text-muted-foreground">
                  Na janela do WhatsApp, confira os dados e toque em enviar. Depois, volte aqui
                  para confirmar.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                className="w-full bg-green-600 font-bold text-white hover:bg-green-700"
                onClick={handleWhatsAppSent}
                data-testid="button-whatsapp-sent"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Já enviei a mensagem
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => window.open(whatsappUrl, "_blank", "noopener,noreferrer")}
                data-testid="button-reopen-whatsapp"
              >
                <Phone className="mr-2 h-4 w-4" />
                Abrir WhatsApp novamente
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Seu carrinho será mantido até você confirmar o envio.
            </p>
          </div>
        )}

        {checkoutStep === "success" && (
          <div className="space-y-5" data-testid="checkout-success-feedback">
            <DialogHeader>
              <div className="mb-2 flex justify-center">
                <div className="rounded-full bg-green-600/15 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <DialogTitle className="text-center font-display uppercase tracking-widest text-primary">
                🎉 Pedido realizado com sucesso!
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Recebemos o seu pedido e ele já foi encaminhado para nossa equipe de vendas.
              </p>
              <p>
                Em breve, um de nossos vendedores entrará em contato pelo WhatsApp para confirmar
                os dados do pedido, informar as melhores opções de pagamento e encontrar a forma
                que melhor atenda às suas necessidades.
              </p>
              <p>
                🚚 Também definiremos a melhor forma de envio, que poderá ser por transportadora
                ou SEDEX, conforme a sua região. O valor do frete será calculado e informado
                durante esse atendimento.
              </p>
              <p>
                Agradecemos pela preferência e pela confiança em nossa equipe. Estamos à
                disposição para atendê-lo da melhor forma!
              </p>
              <p className="font-medium text-foreground">Daniel Valente Detail Store</p>
            </div>

            <Button
              type="button"
              className="w-full font-bold"
              onClick={handleSuccessClose}
              data-testid="button-close-checkout-success"
            >
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
