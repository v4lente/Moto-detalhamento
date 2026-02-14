import { useState, useCallback } from "react";
import { Navbar, Footer } from "@/shared/layout/layout";
import { ProductCard } from "@/features/products/components/product-card";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { fetchProductsWithStats, fetchSettings, fetchRecentReviews, fetchFeaturedServicePosts, fetchOfferedServices, fetchServicePosts } from "@/shared/lib/api";
import { Loader2, Settings, Star, Quote, Play, X, ChevronLeft, ChevronRight, Camera, Wrench, ExternalLink, ImageIcon } from "lucide-react";
import { Link } from "wouter";
import type { ServicePostWithMedia, OfferedService } from "@shared/contracts";

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return match ? match[1] : null;
}

function ServiceMediaCarousel({ 
  servicePost, 
  onOpenModal 
}: { 
  servicePost: ServicePostWithMedia; 
  onOpenModal: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const mediaUrls = servicePost.mediaUrls || [];
  const mediaTypes = servicePost.mediaTypes || [];
  
  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => prev === 0 ? mediaUrls.length - 1 : prev - 1);
  }, [mediaUrls.length]);
  
  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => prev === mediaUrls.length - 1 ? 0 : prev + 1);
  }, [mediaUrls.length]);
  
  if (mediaUrls.length === 0) return null;
  
  const currentUrl = mediaUrls[currentIndex];
  const currentType = mediaTypes[currentIndex];
  const youtubeId = currentType === "video" ? getYouTubeId(currentUrl) : null;
  
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/20 mb-4 group/carousel">
      {currentType === "video" && youtubeId ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : currentType === "video" ? (
        <video
          src={currentUrl}
          className="w-full h-full object-cover"
          controls
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={currentUrl}
          alt={servicePost.title}
          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
          onClick={onOpenModal}
        />
      )}
      
      {mediaUrls.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {mediaUrls.map((_: string, idx: number) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-primary' : 'bg-white/50 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

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

  const { data: featuredServices } = useQuery({
    queryKey: ["featuredServicePosts"],
    queryFn: () => fetchFeaturedServicePosts(8),
  });

  const { data: offeredServices } = useQuery({
    queryKey: ["offeredServices"],
    queryFn: fetchOfferedServices,
  });

  const { data: allServicePosts } = useQuery({
    queryKey: ["allServicePosts"],
    queryFn: fetchServicePosts,
  });

  const [selectedService, setSelectedService] = useState<ServicePostWithMedia | null>(null);
  const [mediaIndex, setMediaIndex] = useState(0);

  const openServiceModal = (service: ServicePostWithMedia) => {
    setSelectedService(service);
    setMediaIndex(0);
  };

  const heroTitleLine1 = settings?.heroTitle || "Estética";
  const heroTitleLine2 = settings?.heroTitleLine2 || "Premium";
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
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-bold uppercase italic leading-none mb-4 sm:mb-6">
              <span>{heroTitleLine1}</span>
              {heroTitleLine2 && (
                <>
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-200">
                    {heroTitleLine2}
                  </span>
                </>
              )}
            </h1>
            <p className="text-sm sm:text-lg text-gray-300 mb-6 sm:mb-8 max-w-lg">
              {heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <Link href="/produtos" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-wider text-sm sm:text-base px-4 sm:px-8" data-testid="button-ver-produtos">
                  Ver Produtos
                </Button>
              </Link>
              <Link href="/agendar" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 font-bold uppercase tracking-wider text-sm sm:text-base px-4 sm:px-8" data-testid="button-agendar">
                  Agendar Serviço
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 container mx-auto px-4 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold uppercase mb-2">Loja Oficial</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Produtos profissionais para você cuidar da sua máquina em casa.</p>
          </div>
          <Link href="/produtos">
            <Button variant="outline" className="border-primary/30 hover:bg-primary/10 w-full sm:w-auto">
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
          <div className="relative group/products">
            <div className="overflow-x-auto scrollbar-hide pb-4">
              <div className="flex gap-6" style={{ width: 'max-content' }}>
                {products.map((product) => (
                  <div key={product.id} className="w-[280px] sm:w-[300px] flex-shrink-0">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={() => {
                const container = document.querySelector('.overflow-x-auto');
                if (container) container.scrollBy({ left: -320, behavior: 'smooth' });
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-black/80 hover:bg-black text-white rounded-full p-3 opacity-0 group-hover/products:opacity-100 transition-opacity z-10 hidden sm:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button 
              onClick={() => {
                const container = document.querySelector('.overflow-x-auto');
                if (container) container.scrollBy({ left: 320, behavior: 'smooth' });
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-black/80 hover:bg-black text-white rounded-full p-3 opacity-0 group-hover/products:opacity-100 transition-opacity z-10 hidden sm:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </section>

      {offeredServices && offeredServices.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-card/30 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-display font-bold uppercase mb-2">
                <Wrench className="inline-block h-6 w-6 sm:h-8 sm:w-8 mr-2 text-primary" />
                Serviços Prestados
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">Conheça os serviços de detalhamento que oferecemos</p>
            </div>

            <div className="relative group/services">
              <div className="overflow-x-auto scrollbar-hide pb-4">
                <div className="flex gap-6" style={{ width: 'max-content' }}>
                  {offeredServices.map((service) => {
                    const linkedPost = service.exampleWorkId ? allServicePosts?.find(s => s.id === service.exampleWorkId) : null;
                    
                    return (
                      <Card 
                        key={service.id} 
                        className="bg-card border-border hover:border-primary/50 transition-colors w-[320px] sm:w-[360px] flex-shrink-0" 
                        data-testid={`home-service-${service.id}`}
                      >
                        <CardContent className="p-6">
                          <h3 className="font-display font-bold text-lg mb-3 text-primary">{service.name}</h3>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{service.details}</p>
                          
                          {linkedPost && (
                            <ServiceMediaCarousel 
                              servicePost={linkedPost} 
                              onOpenModal={() => openServiceModal(linkedPost)}
                            />
                          )}
                          
                          <div className="flex items-center justify-between">
                            {service.approximatePrice ? (
                              <div>
                                <span className="text-xs text-muted-foreground">A partir de</span>
                                <p className="text-xl font-bold text-primary">R$ {service.approximatePrice.toFixed(2)}</p>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">Consulte-nos</span>
                            )}
                            {linkedPost && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary/80"
                                onClick={() => openServiceModal(linkedPost)}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Ver Detalhes
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
              <button 
                onClick={() => {
                  const container = document.querySelector('.group\\/services .overflow-x-auto');
                  if (container) container.scrollBy({ left: -380, behavior: 'smooth' });
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-black/80 hover:bg-black text-white rounded-full p-3 opacity-0 group-hover/services:opacity-100 transition-opacity z-10 hidden sm:flex"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={() => {
                  const container = document.querySelector('.group\\/services .overflow-x-auto');
                  if (container) container.scrollBy({ left: 380, behavior: 'smooth' });
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-black/80 hover:bg-black text-white rounded-full p-3 opacity-0 group-hover/services:opacity-100 transition-opacity z-10 hidden sm:flex"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="text-center mt-8">
              <Link href="/agendar">
                <Button className="bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-wider">
                  Agendar Serviço
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {featuredServices && featuredServices.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-background to-card/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold uppercase mb-2">Nossos Trabalhos</h2>
              <p className="text-muted-foreground">Confira alguns dos serviços de detalhamento realizados</p>
            </div>

            <div className="relative group/works">
              <div className="overflow-x-auto scrollbar-hide pb-4">
                <div className="flex gap-6" style={{ width: 'max-content' }}>
                  {featuredServices.map((service) => (
                    <Card
                      key={service.id}
                      className="bg-card border-border hover:border-primary/50 transition-colors w-[320px] sm:w-[360px] flex-shrink-0 cursor-pointer"
                      onClick={() => openServiceModal(service)}
                      data-testid={`service-gallery-${service.id}`}
                    >
                      <CardContent className="p-6">
                        <h3 className="font-display font-bold text-lg mb-3 text-primary">{service.title}</h3>
                        {service.vehicleInfo && (
                          <p className="text-sm text-muted-foreground mb-2">{service.vehicleInfo}</p>
                        )}
                        {service.clientName && (
                          <p className="text-xs text-muted-foreground mb-4">Cliente: {service.clientName}</p>
                        )}
                        
                        <ServiceMediaCarousel 
                          servicePost={service} 
                          onOpenModal={() => openServiceModal(service)}
                        />
                        
                        {service.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{service.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => {
                  const container = document.querySelector('.group\\/works .overflow-x-auto');
                  if (container) container.scrollBy({ left: -380, behavior: 'smooth' });
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-black/80 hover:bg-black text-white rounded-full p-3 opacity-0 group-hover/works:opacity-100 transition-opacity z-10 hidden sm:flex"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={() => {
                  const container = document.querySelector('.group\\/works .overflow-x-auto');
                  if (container) container.scrollBy({ left: 380, behavior: 'smooth' });
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-black/80 hover:bg-black text-white rounded-full p-3 opacity-0 group-hover/works:opacity-100 transition-opacity z-10 hidden sm:flex"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="max-w-4xl bg-card border-border p-0 overflow-hidden">
          {selectedService && (
            <div className="relative">
              <div className="aspect-video bg-black relative">
                {selectedService.mediaUrls && selectedService.mediaUrls.length > 0 ? (
                  selectedService.mediaTypes[mediaIndex] === "video" ? (
                    <iframe
                      src={selectedService.mediaUrls[mediaIndex]}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <img
                      src={selectedService.mediaUrls[mediaIndex]}
                      alt={selectedService.title}
                      className="w-full h-full object-contain"
                    />
                  )
                ) : null}

                {selectedService.mediaUrls && selectedService.mediaUrls.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={() => setMediaIndex((prev) => prev === 0 ? selectedService.mediaUrls.length - 1 : prev - 1)}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={() => setMediaIndex((prev) => prev === selectedService.mediaUrls.length - 1 ? 0 : prev + 1)}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {selectedService.mediaUrls.map((_: string, idx: number) => (
                        <button
                          key={idx}
                          className={`w-2 h-2 rounded-full transition-colors ${idx === mediaIndex ? 'bg-primary' : 'bg-white/50'}`}
                          onClick={() => setMediaIndex(idx)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="p-6">
                <h3 className="font-display font-bold text-xl mb-2">{selectedService.title}</h3>
                {selectedService.description && (
                  <p className="text-muted-foreground mb-4">{selectedService.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {selectedService.clientName && (
                    <span>Cliente: <span className="text-primary">{selectedService.clientName}</span></span>
                  )}
                  {selectedService.vehicleInfo && (
                    <span>Veículo: <span className="text-primary">{selectedService.vehicleInfo}</span></span>
                  )}
                  <span>{new Date(selectedService.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {recentReviews && recentReviews.length > 0 && (
        <section className="py-16 bg-card/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-display font-bold uppercase mb-2">O Que Nossos Clientes Dizem</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Avaliações recentes dos nossos produtos</p>
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
                          className="w-16 h-16 rounded-lg object-contain cursor-pointer hover:opacity-80 transition-opacity bg-black/20"
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
