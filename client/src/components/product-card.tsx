import { useState } from "react";
import { Product } from "@shared/schema";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Plus, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface ProductCardProps {
  product: Product & { avgRating?: number; reviewCount?: number };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const allImages = [product.image, ...(product.images || [])];

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(prev => prev <= 0 ? allImages.length - 1 : prev - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(prev => prev >= allImages.length - 1 ? 0 : prev + 1);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-3 w-3 ${star <= Math.round(rating) ? "fill-primary text-primary" : "text-muted-foreground"}`}
          />
        ))}
        <span className="ml-1 text-xs text-muted-foreground">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  return (
    <Card className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300" data-testid={`card-product-${product.id}`}>
      <div className="overflow-hidden bg-black/20 relative group/image" style={{ minHeight: '200px' }}>
        <Link href={`/produto/${product.id}`}>
          <img 
            src={allImages[currentIndex]} 
            alt={product.name} 
            className="w-full h-auto max-h-[280px] object-contain transition-transform duration-500 group-hover:scale-110 cursor-pointer"
            data-testid={`img-product-${product.id}`}
          />
        </Link>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        {allImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black text-white rounded-full p-1.5 z-20"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black text-white rounded-full p-1.5 z-20"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {allImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-primary' : 'bg-white/60 hover:bg-white'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <CardHeader className="p-4 pb-2">
        <div className="text-xs text-primary font-bold uppercase tracking-wider mb-1" data-testid={`text-category-${product.id}`}>
          {product.category}
        </div>
        <Link href={`/produto/${product.id}`}>
          <h3 className="font-display font-bold text-lg leading-tight line-clamp-2 min-h-[3rem] hover:text-primary transition-colors cursor-pointer" data-testid={`text-name-${product.id}`}>
            {product.name}
          </h3>
        </Link>
        {product.avgRating !== undefined && (
          <div className="mt-1">
            {renderStars(product.avgRating)}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10" data-testid={`text-description-${product.id}`}>
          {product.description}
        </p>
        <div className="text-xl font-bold text-white" data-testid={`text-price-${product.id}`}>
          R$ {product.price.toFixed(2)}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-wider"
          onClick={() => addToCart(product)}
          data-testid={`button-add-${product.id}`}
        >
          <Plus className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </CardFooter>
    </Card>
  );
}
