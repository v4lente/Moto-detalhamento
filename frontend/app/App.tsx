import { Switch, Route } from "wouter";
import { queryClient } from "@/shared/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/shared/ui/toaster";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { CartProvider } from "@/features/cart/lib/cart";
import Home from "@/features/home/pages/home";
import Login from "@/features/auth/pages/login";
import Admin from "@/features/admin";
import Conta from "@/features/account/pages/conta";
import Produtos from "@/features/products/pages/produtos";
import Produto from "@/features/products/pages/produto";
import Agendar from "@/features/scheduling/pages/agendar";
import CheckoutSuccess from "@/features/checkout/pages/checkout-success";
import CheckoutCancel from "@/features/checkout/pages/checkout-cancel";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/admin" component={Admin} />
      <Route path="/conta" component={Conta} />
      <Route path="/produtos" component={Produtos} />
      <Route path="/produto/:id" component={Produto} />
      <Route path="/agendar" component={Agendar} />
      <Route path="/pedido/sucesso" component={CheckoutSuccess} />
      <Route path="/pedido/cancelado" component={CheckoutCancel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
