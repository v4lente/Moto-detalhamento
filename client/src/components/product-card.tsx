import { Product } from "@/data/products";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Plus } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <Card className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300">
      <div className="aspect-square overflow-hidden bg-background relative">
        <img 
          src={product.image} 
          alt={product.name} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <CardHeader className="p-4 pb-2">
        <div className="text-xs text-primary font-bold uppercase tracking-wider mb-1">
          {product.category}
        </div>
        <h3 className="font-display font-bold text-lg leading-tight line-clamp-2 min-h-[3rem]">
          {product.name}
        </h3>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
          {product.description}
        </p>
        <div className="text-xl font-bold text-white">
          R$ {product.price.toFixed(2)}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-wider"
          onClick={() => addToCart(product)}
        >
          <Plus className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </CardFooter>
    </Card>
  );
}
