import { useState } from "react";
import { Link } from "wouter";
import { ShoppingCart, Phone, Settings, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useQuery } from "@tanstack/react-query";
import { fetchSettings, getCurrentCustomer } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckoutDialog } from "./checkout-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Navbar() {
  const { cartCount, items, updateQuantity, cartTotal } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const { data: customer } = useQuery({
    queryKey: ["customer"],
    queryFn: getCurrentCustomer,
  });

  const handleCheckout = () => {
    setCheckoutOpen(true);
  };

  const siteName = settings?.siteName || "Daniel Valente";
  const logoImage = settings?.logoImage;
  const nameParts = siteName.split(" ");
  const firstName = nameParts[0] || "Daniel";
  const lastName = nameParts.slice(1).join(" ") || "Valente";

  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
          {logoImage && (
            <img src={logoImage} alt={siteName} className="h-8 w-8 sm:h-10 sm:w-10 rounded object-cover flex-shrink-0" />
          )}
          <span className="font-display font-bold text-sm sm:text-xl uppercase tracking-wider sm:tracking-widest text-white truncate">
            <span className="text-primary">{firstName}</span> <span className="hidden sm:inline">{lastName}</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/conta">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" data-testid="button-account">
              <User className="h-5 w-5" />
            </Button>
          </Link>

          <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative border-primary/20 hover:bg-primary/10 hover:text-primary" data-testid="button-cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-black text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center" data-testid="text-cart-count">
                  {cartCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md bg-card border-l border-primary/20">
            <SheetHeader>
              <SheetTitle className="font-display uppercase tracking-widest text-primary">Seu Carrinho</SheetTitle>
            </SheetHeader>
            
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                <p>Seu carrinho está vazio</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[60vh] my-4 pr-4">
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 items-start" data-testid={`cart-item-${item.id}`}>
                        <div className="h-16 w-16 bg-background rounded-md overflow-hidden border border-border">
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" data-testid={`img-cart-${item.id}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium line-clamp-1" data-testid={`text-cart-name-${item.id}`}>{item.name}</h4>
                          <p className="text-sm text-primary font-bold" data-testid={`text-cart-price-${item.id}`}>R$ {item.price.toFixed(2)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-6 w-6 text-[10px]"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              data-testid={`button-decrease-${item.id}`}
                            >
                              -
                            </Button>
                            <span className="text-xs w-4 text-center" data-testid={`text-quantity-${item.id}`}>{item.quantity}</span>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-6 w-6 text-[10px]"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              data-testid={`button-increase-${item.id}`}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="space-y-4">
                  <Separator />
                  <div className="flex justify-between text-lg font-bold font-display">
                    <span>Total</span>
                    <span className="text-primary" data-testid="text-cart-total">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold" 
                    onClick={handleCheckout}
                    data-testid="button-checkout"
                  >
                    <Phone className="mr-2 h-4 w-4" /> Finalizar pelo WhatsApp
                  </Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
        </div>

        <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
      </div>
    </nav>
  );
}

interface FooterProps {
  settings?: {
    siteName?: string;
    footerText?: string;
    copyrightText?: string;
  } | null;
}

export function Footer({ settings }: FooterProps) {
  const siteName = settings?.siteName || "Daniel Valente";
  const nameParts = siteName.split(" ");
  const firstName = nameParts[0] || "Daniel";
  const lastName = nameParts.slice(1).join(" ") || "Valente";

  return (
    <footer className="bg-secondary py-12 mt-20 border-t border-primary/10">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-display font-bold text-2xl uppercase mb-4">
          <span className="text-primary">{firstName}</span> {lastName}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
          {settings?.footerText || "Especialistas em detalhamento de motos. Cuidamos da sua máquina com os melhores produtos do mercado."}
        </p>
        <div className="text-xs text-muted-foreground/50 mb-4">
          {settings?.copyrightText || "© 2024 Daniel Valente Moto Detalhamento. Todos os direitos reservados."}
        </div>
        <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground/40 hover:text-primary transition-colors" data-testid="link-admin">
          <Settings className="h-3 w-3" /> Área Administrativa
        </Link>
      </div>
    </footer>
  );
}
