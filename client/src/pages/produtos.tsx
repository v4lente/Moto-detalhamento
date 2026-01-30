import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { fetchProductsWithStats, fetchSettings, fetchProductVariations, ProductWithStats } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Star, Search, ArrowLeft, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductVariation } from "@shared/schema";

type SortOption = "rating" | "price_asc" | "price_desc" | "name";

export default function Produtos() {
  const { toast } = useToast();
  const { addToCart } = useCart();
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
            <Link href="/">
              <Button variant="outline" size="icon">
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </Link>
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
                <Link href={`/produto/${product.id}`}>
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {(() => {
                      const variations = productVariations[product.id];
                      const hasVariations = variations && variations.length > 0;
                      const allVariationsOutOfStock = hasVariations && variations.every(v => !v.inStock);
                      const isOutOfStock = hasVariations ? allVariationsOutOfStock : !product.inStock;
                      
                      return isOutOfStock ? (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            Sem Estoque
                          </span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </Link>
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
                    <Link href={`/produto/${product.id}`}>
                      <Button 
                        size="sm" 
                        className="bg-primary text-black hover:bg-primary/90"
                        data-testid={`view-product-${product.id}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </Link>
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
