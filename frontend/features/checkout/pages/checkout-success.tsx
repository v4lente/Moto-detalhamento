import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getOrderPaymentStatus, fetchCustomerOrder } from "@/shared/lib/api";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { CheckCircle, Loader2, Package, Home, ShoppingBag, AlertCircle } from "lucide-react";

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();
  const [orderId, setOrderId] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Extract query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderIdParam = params.get("order_id");
    const sessionIdParam = params.get("session_id");
    
    if (orderIdParam) {
      setOrderId(parseInt(orderIdParam));
    }
    if (sessionIdParam) {
      setSessionId(sessionIdParam);
    }
  }, []);

  // Poll for payment status
  const { data: paymentStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["payment-status", orderId],
    queryFn: () => getOrderPaymentStatus(orderId!),
    enabled: !!orderId,
    refetchInterval: (query) => {
      // Stop polling once payment is confirmed
      if (query.state.data?.paymentStatus === "paid") {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });

  // Fetch order details once payment is confirmed
  const { data: orderDetails, isLoading: orderLoading } = useQuery({
    queryKey: ["order-details", orderId],
    queryFn: () => fetchCustomerOrder(orderId!),
    enabled: !!orderId && paymentStatus?.paymentStatus === "paid",
  });

  const isPaid = paymentStatus?.paymentStatus === "paid";
  const isProcessing = statusLoading || paymentStatus?.paymentStatus === "awaiting_payment";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          {isProcessing ? (
            <>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl">Processando Pagamento</CardTitle>
              <CardDescription>
                Aguarde enquanto confirmamos seu pagamento...
              </CardDescription>
            </>
          ) : isPaid ? (
            <>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">Pagamento Confirmado!</CardTitle>
              <CardDescription>
                Seu pedido foi recebido e está sendo processado
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl">Status do Pagamento</CardTitle>
              <CardDescription>
                {paymentStatus?.paymentStatus === "failed" 
                  ? "Houve um problema com seu pagamento" 
                  : "Verificando status do pagamento..."}
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {orderId && (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Número do Pedido</p>
              <p className="text-2xl font-bold text-primary">#{orderId}</p>
            </div>
          )}

          {isPaid && orderDetails && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Itens do Pedido
                </h3>
                <ul className="space-y-2">
                  {orderDetails.items.map((item, index) => (
                    <li key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.productName}</span>
                      <span className="text-muted-foreground">
                        R$ {(item.productPrice * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between font-bold mt-3 pt-3 border-t">
                  <span>Total</span>
                  <span className="text-primary">R$ {orderDetails.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 text-sm">
                <p className="text-green-800 dark:text-green-200">
                  Você receberá atualizações sobre seu pedido por email e WhatsApp.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link href="/conta">
              <Button className="w-full" variant="default">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Ver Meus Pedidos
              </Button>
            </Link>
            <Link href="/">
              <Button className="w-full" variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Voltar para a Loja
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
