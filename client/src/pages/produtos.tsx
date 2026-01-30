import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { fetchProductsWithStats, fetchSettings, fetchProductVariations, ProductWithStats } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Star, Search, ArrowLeft, Plus, Eye, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductVariation } from "@shared/schema";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckoutDialog } from "@/components/checkout-dialog";

type SortOption = "rating" | "price_asc" | "price_desc" | "name";

export default function Produtos() {
  const { toast } = useToast();
  const { addToCart, cartCount, items, updateQuantity, cartTotal } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: products, isLoading } = useQuery({
    queryKey: ["products-with-stats"],
    queryFn: fetchProductsWithStats,
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const [productVariations, setProductVariations] = useState<Record<number, ProductVariation[]>>({});
  const [productImageIndex, setProductImageIndex] = useState<Record<number, number>>({});

  useEffect(() => {
    if (products) {
      products.forEach(async (product) => {
        try {
          const variations = await fetchProductVariations(product.id);
          if (variations.length > 0) {
            setProductVariations(prev => ({ ...prev, [product.id]: variations }));
          }
        } catch (e) {
          // Ignore errors for individual product variations
        }
      });
    }
  }, [products]);

  const categories = useMemo(() => {
    if (!products) return [];
    const cats = Array.from(new Set(products.map(p => p.category)));
    return cats.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    switch (sortBy) {
      case "rating":
        return filtered.sort((a, b) => b.avgRating - a.avgRating);
      case "price_asc":
        return filtered.sort((a, b) => a.price - b.price);
      case "price_desc":
        return filtered.sort((a, b) => b.price - a.price);
      case "name":
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return filtered;
    }
  }, [products, search, sortBy, selectedCategory]);

  const handleAddToCart = (product: ProductWithStats) => {
    addToCart(product);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= Math.round(rating) ? "fill-primary text-primary" : "text-muted-foreground"}`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-base sm:text-xl font-display font-bold text-primary truncate max-w-[120px] sm:max-w-none">
              {settings?.siteName || "Produtos"}
            </h1>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <ShoppingCart className="h-4 w-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
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
                        {items.map((item) => {
                          const itemKey = `${item.id}-${item.variationId || 'base'}`;
                          return (
                            <div key={itemKey} className="flex gap-4 items-start">
                              <div className="h-16 w-16 bg-background rounded-md overflow-hidden border border-border">
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-medium line-clamp-1">
                                  {item.name}
                                  {item.variationLabel && <span className="text-primary ml-1">({item.variationLabel})</span>}
                                </h4>
                                <p className="text-sm text-primary font-bold">R$ {item.price.toFixed(2)}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-6 w-6 text-[10px]"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.variationId)}
                                  >
                                    -
                                  </Button>
                                  <span className="text-xs w-4 text-center">{item.quantity}</span>
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-6 w-6 text-[10px]"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.variationId)}
                                  >
                                    +
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
                        onClick={() => setCheckoutOpen(true)}
                      >
                        <Phone className="mr-2 h-4 w-4" /> Finalizar pelo WhatsApp
                      </Button>
                    </div>
                  </>
                )}
              </SheetContent>
            </Sheet>
            <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-display font-bold">Nossos Produtos</h2>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-category">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-sort">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Melhor Avaliados</SelectItem>
                <SelectItem value="price_asc">Menor Preço</SelectItem>
                <SelectItem value="price_desc">Maior Preço</SelectItem>
                <SelectItem value="name">Nome A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <Card 
                key={product.id} 
                className="bg-card border-border overflow-hidden group hover:border-primary/50 transition-colors"
                data-testid={`product-card-${product.id}`}
              >
                <div className="aspect-square overflow-hidden relative group/card">
                  {(() => {
                    const allImages = [product.image, ...(product.images || [])];
                    const currentIndex = productImageIndex[product.id] || 0;
                    const handlePrev = (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const newIndex = currentIndex <= 0 ? allImages.length - 1 : currentIndex - 1;
                      setProductImageIndex(prev => ({ ...prev, [product.id]: newIndex }));
                    };
                    const handleNext = (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const newIndex = currentIndex >= allImages.length - 1 ? 0 : currentIndex + 1;
                      setProductImageIndex(prev => ({ ...prev, [product.id]: newIndex }));
                    };

                    return (
                      <>
                        <Link href={`/produto/${product.id}`}>
                          <img
                            src={allImages[currentIndex]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>
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
                                    setProductImageIndex(prev => ({ ...prev, [product.id]: idx }));
                                  }}
                                  className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-primary' : 'bg-white/60 hover:bg-white'}`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                  {(() => {
                    const variations = productVariations[product.id];
                    const hasVariations = variations && variations.length > 0;
                    const allVariationsOutOfStock = hasVariations && variations.every(v => !v.inStock);
                    const isOutOfStock = hasVariations ? allVariationsOutOfStock : !product.inStock;
                    
                    return isOutOfStock ? (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          Sem Estoque
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>
                <CardContent className="p-4">
                  <Link href={`/produto/${product.id}`}>
                    <h3 className="font-bold text-lg mb-1 hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {product.description}
                  </p>
                  {productVariations[product.id] && productVariations[product.id].length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {productVariations[product.id].map(v => (
                        <span 
                          key={v.id} 
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            v.inStock 
                              ? "bg-primary/20 text-primary" 
                              : "bg-red-500/20 text-red-400 line-through"
                          }`}
                          data-testid={`variation-badge-${v.id}`}
                        >
                          {v.label}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mb-3">
                    {renderStars(product.avgRating)}
                    <span className="text-xs text-muted-foreground">
                      {product.reviewCount} avaliações
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    {productVariations[product.id] && productVariations[product.id].length > 0 ? (
                      <span className="text-lg font-bold text-primary">
                        A partir de R$ {Math.min(...productVariations[product.id].map(v => v.price)).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xl font-bold text-primary">
                        R$ {product.price.toFixed(2)}
                      </span>
                    )}
                    <div className="flex gap-1">
                      <Link href={`/produto/${product.id}`}>
                        <Button 
                          variant="outline"
                          size="sm"
                          data-testid={`view-product-${product.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {(() => {
                        const variations = productVariations[product.id];
                        const hasVariations = variations && variations.length > 0;
                        const allVariationsOutOfStock = hasVariations && variations.every(v => !v.inStock);
                        const isOutOfStock = hasVariations ? allVariationsOutOfStock : !product.inStock;
                        
                        return (
                          <Button 
                            size="sm" 
                            className={isOutOfStock 
                              ? "bg-gray-500 text-white cursor-not-allowed" 
                              : "bg-primary text-black hover:bg-primary/90"
                            }
                            disabled={isOutOfStock}
                            onClick={(e) => {
                              e.preventDefault();
                              if (!isOutOfStock && !hasVariations) {
                                handleAddToCart(product);
                              } else if (!isOutOfStock) {
                                window.location.href = `/produto/${product.id}`;
                              }
                            }}
                            data-testid={`add-product-${product.id}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
