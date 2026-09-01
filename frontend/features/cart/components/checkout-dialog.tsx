import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentCustomer, type CustomerData } from "@/shared/lib/api";
import { useCart } from "@/features/cart/lib/cart";
import { CustomerLoginForm } from "@/features/auth/components/CustomerLoginForm";
import { CustomerRegistrationForm } from "@/features/auth/components/CustomerRegistrationForm";
import { CustomerProfileForm } from "@/features/account/components/CustomerProfileForm";
import { CheckoutReview } from "@/features/checkout/components/CheckoutReview";
import { CheckoutConfirmation } from "@/features/checkout/components/CheckoutConfirmation";
import { useCheckoutFlow } from "@/features/checkout/hooks/use-checkout-flow";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import { Loader2, ShoppingCart } from "lucide-react";

type Step = "identify" | "profile" | "review" | "success";
export function CheckoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { checkoutItems, items, clearCart } = useCart();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("identify");
  const [authTab, setAuthTab] = useState("login");
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [confirmation, setConfirmation] = useState<{ reference: string; whatsappShareUrl: string | null } | null>(null);
  const flow = useCheckoutFlow(checkoutItems);
  const customerQuery = useQuery({ queryKey: ["customer"], queryFn: getCurrentCustomer, enabled: open });

  useEffect(() => {
    if (!open) return;
    if (customerQuery.data) {
      setCustomer(customerQuery.data);
      setStep(customerQuery.data.profileComplete ? "review" : "profile");
    } else {
      setCustomer(null);
      setStep("identify");
    }
  }, [open, customerQuery.data]);

  useEffect(() => {
    if (open && step === "review" && checkoutItems.length) flow.preview.mutate();
    // A alteração do carrinho deve gerar um novo preview do servidor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, checkoutItems.map((item) => `${item.productId}:${item.variationId}:${item.quantity}`).join(",")]);

  const onAuthenticated = (profile: CustomerData) => {
    setCustomer(profile);
    queryClient.setQueryData(["customer"], profile);
    setStep(profile.profileComplete ? "review" : "profile");
  };

  const confirm = () => {
    if (!flow.preview.data) return;
    flow.order.mutate({ fingerprint: flow.preview.data.fingerprint, paymentMethod: "whatsapp" }, {
      onSuccess: (result) => {
        clearCart();
        setConfirmation({ reference: result.publicReference, whatsappShareUrl: result.whatsappShareUrl });
        setStep("success");
        queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
        flow.resetIdempotencyKey();
      },
    });
  };

  const close = (nextOpen: boolean) => {
    if (!nextOpen && step === "success") {
      setConfirmation(null);
      setStep("identify");
    }
    onOpenChange(nextOpen);
  };

  return <Dialog open={open} onOpenChange={close}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" aria-describedby={undefined}>
    {step === "identify" && <><DialogHeader><DialogTitle className="font-display uppercase tracking-widest text-primary">Identifique-se para continuar</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Seu pedido será salvo no histórico da sua conta.</p><Tabs value={authTab} onValueChange={setAuthTab}><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">Entrar</TabsTrigger><TabsTrigger value="register">Criar conta</TabsTrigger></TabsList><TabsContent value="login" className="pt-4"><CustomerLoginForm onSuccess={onAuthenticated} /></TabsContent><TabsContent value="register" className="pt-4"><CustomerRegistrationForm onSuccess={onAuthenticated} /></TabsContent></Tabs></>}
    {step === "profile" && customer && <><DialogHeader><DialogTitle className="font-display uppercase tracking-widest text-primary">Complete seu perfil</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Precisamos destes dados uma única vez para salvar o pedido.</p><CustomerProfileForm customer={customer} onSuccess={(profile) => { setCustomer(profile); queryClient.setQueryData(["customer"], profile); setStep("review"); }} /></>}
    {step === "review" && <><DialogHeader><DialogTitle className="font-display uppercase tracking-widest text-primary"><ShoppingCart className="mr-2 inline h-5 w-5" /> Revisar pedido</DialogTitle></DialogHeader>{flow.preview.error ? <div className="space-y-3"><p className="text-sm text-destructive">{(flow.preview.error as Error).message}</p><Button variant="outline" onClick={() => flow.preview.mutate()}>Tentar novamente</Button></div> : <CheckoutReview preview={flow.preview.data} loading={flow.order.isPending} onConfirm={confirm} />}</>}
    {step === "success" && confirmation && <CheckoutConfirmation reference={confirmation.reference} whatsappShareUrl={confirmation.whatsappShareUrl} onClose={() => close(false)} />}
    {flow.order.error && <p role="alert" aria-live="assertive" className="mt-3 text-sm text-destructive">{(flow.order.error as Error).message}</p>}
    {flow.preview.isPending && step === "review" && <Loader2 className="mx-auto mt-2 h-4 w-4 animate-spin" />}
    {items.length === 0 && step !== "success" && <p className="text-center text-sm text-muted-foreground">Seu carrinho está vazio.</p>}
  </DialogContent></Dialog>;
}
