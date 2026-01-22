import { Link } from "wouter";
import { ShoppingCart, Phone } from "lucide-react";
import { useCart } from "@/lib/cart";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import logoImage from "@assets/WhatsApp_Image_2026-01-21_at_22.14.47_1769044534872.jpeg";

export function Navbar() {
  const { cartCount, items, updateQuantity, removeFromCart, cartTotal } = useCart();

  const handleCheckout = () => {
    const phoneNumber = "5511999999999"; // Replace with actual number
    const message = items
      .map((item) => `${item.quantity}x ${item.name} (R$ ${item.price.toFixed(2)})`)
      .join("%0A");
    const total = `Total: R$ ${cartTotal.toFixed(2)}`;
    const fullMessage = `Olá Daniel Valente! Gostaria de fazer o seguinte pedido:%0A%0A${message}%0A%0A${total}`;
    
    window.open(`https://wa.me/${phoneNumber}?text=${fullMessage}`, "_blank");
  };

  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2">
            <span className="font-display font-bold text-xl uppercase tracking-widest text-white">
              <span className="text-primary">Daniel</span> Valente
            </span>
          </a>
        </Link>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative border-primary/20 hover:bg-primary/10 hover:text-primary">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-black text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
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
                      <div key={item.id} className="flex gap-4 items-start">
                        <div className="h-16 w-16 bg-background rounded-md overflow-hidden border border-border">
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium line-clamp-1">{item.name}</h4>
                          <p className="text-sm text-primary font-bold">R$ {item.price.toFixed(2)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-6 w-6 text-[10px]"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="text-xs w-4 text-center">{item.quantity}</span>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-6 w-6 text-[10px]"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
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
                    <span className="text-primary">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold" 
                    onClick={handleCheckout}
                  >
                    <Phone className="mr-2 h-4 w-4" /> Finalizar pelo WhatsApp
                  </Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-secondary py-12 mt-20 border-t border-primary/10">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-display font-bold text-2xl uppercase mb-4">
          <span className="text-primary">Daniel</span> Valente
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
          Especialistas em detalhamento de motos. Cuidamos da sua máquina com os melhores produtos do mercado.
        </p>
        <div className="text-xs text-muted-foreground/50">
          © 2024 Daniel Valente Moto Detalhamento. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
