import { Navbar, Footer } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetchProductsWithStats, fetchSettings, fetchRecentReviews } from "@/lib/api";
import { Loader2, Settings, Star, Quote } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data: products, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ["products-with-stats"],
    queryFn: fetchProductsWithStats,
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const { data: recentReviews } = useQuery({
    queryKey: ["recent-reviews"],
    queryFn: () => fetchRecentReviews(6),
  });

  const heroTitle = settings?.heroTitle || "Estética Premium";
  const heroSubtitle = settings?.heroSubtitle || "Cuidado profissional para sua moto. Utilizamos e vendemos apenas os melhores produtos do mercado mundial.";
  const backgroundImage = settings?.backgroundImage || "/assets/WhatsApp_Image_2026-01-21_at_22.14.47_1769044534872.jpeg";

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <section className="relative h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent z-10" />
          <img 
            src={backgroundImage} 
            alt="Moto Detailing Studio" 
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-20">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-display font-bold uppercase italic leading-none mb-6">
              {heroTitle.split(" ").map((word, i) => (
                i === 0 ? (
                  <span key={i}>{word} <br/></span>
                ) : (
                  <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-200">
                    {word}
                  </span>
                )
              ))}
            </h1>
            <p className="text-lg text-gray-300 mb-8 max-w-lg">
              {heroSubtitle}
            </p>
            <div className="flex gap-4">
              <Link href="/produtos">
                <Button size="lg" className="bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-wider text-base px-8" data-testid="button-ver-produtos">
                  Ver Produtos
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold uppercase tracking-wider text-base px-8" data-testid="button-agendar">
                Agendar Serviço
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 container mx-auto px-4 flex-1">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-display font-bold uppercase mb-2">Loja Oficial</h2>
            <p className="text-muted-foreground">Produtos profissionais para você cuidar da sua máquina em casa.</p>
          </div>
          <Link href="/produtos">
            <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
              Ver Todos
            </Button>
          </Link>
        </div>

        {productsLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {productsError && (
          <div className="text-center text-red-500 py-12">
            Erro ao carregar produtos. Tente novamente mais tarde.
          </div>
        )}

        {products && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {recentReviews && recentReviews.length > 0 && (
        <section className="py-16 bg-card/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold uppercase mb-2">O Que Nossos Clientes Dizem</h2>
              <p className="text-muted-foreground">Avaliações recentes dos nossos produtos</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentReviews.map((review) => (
                <Card key={review.id} className="bg-card border-border hover:border-primary/30 transition-colors" data-testid={`review-card-${review.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Link href={`/produto/${review.productId}`}>
                        <img 
                          src={review.productImage} 
                          alt={review.productName}
                          className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/produto/${review.productId}`}>
                          <h4 className="font-semibold text-sm truncate hover:text-primary transition-colors cursor-pointer">
                            {review.productName}
                          </h4>
                        </Link>
                        <div className="mt-1">{renderStars(review.rating)}</div>
                      </div>
                    </div>
                    
                    {review.comment && (
                      <div className="relative">
                        <Quote className="absolute -top-1 -left-1 h-4 w-4 text-primary/30" />
                        <p className="text-muted-foreground text-sm pl-4 line-clamp-3">
                          {review.comment}
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">{review.customerName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer settings={settings} />

      <Link href="/admin" className="fixed bottom-4 right-4">
        <Button 
          size="icon" 
          variant="outline" 
          className="h-10 w-10 rounded-full border-primary/20 bg-card hover:bg-primary/10"
          data-testid="button-admin"
          asChild
        >
          <span><Settings className="h-4 w-4" /></span>
        </Button>
      </Link>
    </div>
  );
}
