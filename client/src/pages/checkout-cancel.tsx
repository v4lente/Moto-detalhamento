import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, Home, ShoppingCart, RefreshCw } from "lucide-react";

export default function CheckoutCancel() {
  const [orderId, setOrderId] = useState<number | null>(null);

  // Extract order_id from query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderIdParam = params.get("order_id");
    
    if (orderIdParam) {
      setOrderId(parseInt(orderIdParam));
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Pagamento Cancelado</CardTitle>
          <CardDescription>
            O pagamento foi cancelado ou não foi concluído
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {orderId && (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Pedido</p>
              <p className="text-xl font-bold">#{orderId}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Este pedido não foi finalizado
              </p>
            </div>
          )}

          <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 text-sm">
            <p className="text-orange-800 dark:text-orange-200">
              Não se preocupe! Seus itens ainda estão no carrinho. 
              Você pode tentar novamente quando quiser.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              O que você gostaria de fazer?
            </p>
            
            <div className="flex flex-col gap-3">
              <Link href="/produtos">
                <Button className="w-full" variant="default">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar Novamente
                </Button>
              </Link>
              
              <Link href="/produtos">
                <Button className="w-full" variant="outline">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Continuar Comprando
                </Button>
              </Link>
              
              <Link href="/">
                <Button className="w-full" variant="ghost">
                  <Home className="mr-2 h-4 w-4" />
                  Voltar para a Página Inicial
                </Button>
              </Link>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>Precisa de ajuda? Entre em contato conosco pelo WhatsApp</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
