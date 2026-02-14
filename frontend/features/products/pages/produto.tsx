import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { fetchProduct, fetchProductReviews, createReview, getCurrentCustomer, fetchProductVariations } from "@/shared/lib/api";
import { useCart } from "@/features/cart/lib/cart";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Textarea } from "@/shared/ui/textarea";
import { ShoppingCart, Star, ArrowLeft, Plus, Minus, User, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import type { ProductVariation } from "@shared/contracts";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";
import { CheckoutDialog } from "@/features/cart/components/checkout-dialog";

export default function Produto() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id || "0");
  const { toast } = useToast();
  const { addToCart, cartCount, items, updateQuantity, cartTotal } = useCart();
  const queryClient = useQueryClient();
  
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
    enabled: productId > 0,
  });

  const { data: variations } = useQuery({
    queryKey: ["variations", productId],
    queryFn: () => fetchProductVariations(productId),
    enabled: productId > 0,
  });

  useEffect(() => {
    if (variations && variations.length > 0 && !selectedVariation) {
      setSelectedVariation(variations[0]);
    }
  }, [variations, selectedVariation]);

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => fetchProductReviews(productId),
    enabled: productId > 0,
  });

  const { data: customer } = useQuery({
    queryKey: ["customer"],
    queryFn: getCurrentCustomer,
  });

  const createReviewMutation = useMutation({
    mutationFn: () => createReview(productId, rating, comment || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["products-with-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-reviews"] });
      toast({ title: "Avaliação enviada com sucesso!" });
      setRating(0);
      setComment("");
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const handleAddToCart = () => {
    if (!product) return;
    const hasVariations = variations && variations.length > 0;
    for (let i = 0; i < quantity; i++) {
      addToCart(product, hasVariations ? selectedVariation || undefined : undefined);
    }
  };

  const currentPrice = selectedVariation?.price ?? product?.price ?? 0;

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast({ title: "Selecione uma avaliação", variant: "destructive" });
      return;
    }
    createReviewMutation.mutate();
  };

  const renderStars = (currentRating: number, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-6 w-6 cursor-pointer transition-colors ${
              star <= (interactive ? (hoverRating || rating) : currentRating)
                ? "fill-primary text-primary"
                : "text-muted-foreground hover:text-primary/50"
            }`}
            onClick={interactive ? () => setRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          />
        ))}
      </div>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (productLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Produto não encontrado.</p>
        <Link href="/produtos">
          <Button>Voltar aos Produtos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/produtos">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
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
                              <div className="h-16 w-16 bg-black/20 rounded-md overflow-hidden border border-border flex items-center justify-center">
                                <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
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
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="space-y-3">
            {(() => {
              const allImages = [product.image, ...(product.images || [])];
              const currentIndex = selectedImage ? allImages.indexOf(selectedImage) : 0;
              const handlePrev = () => {
                const newIndex = currentIndex <= 0 ? allImages.length - 1 : currentIndex - 1;
                setSelectedImage(newIndex === 0 ? null : allImages[newIndex]);
              };
              const handleNext = () => {
                const newIndex = currentIndex >= allImages.length - 1 ? 0 : currentIndex + 1;
                setSelectedImage(newIndex === 0 ? null : allImages[newIndex]);
              };
              
              return (
                <div className="relative group/gallery rounded-lg overflow-hidden border border-border bg-black/20" style={{ minHeight: '300px' }}>
                  <img
                    src={selectedImage || product.image}
                    alt={product.name}
                    className="w-full h-auto object-contain"
                  />
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={handlePrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 opacity-0 group-hover/gallery:opacity-100 transition-opacity"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 opacity-0 group-hover/gallery:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {allImages.map((_: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImage(idx === 0 ? null : allImages[idx])}
                            className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-primary' : 'bg-white/50 hover:bg-white/70'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
            {product.images && product.images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedImage(null)}
                  className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                    !selectedImage ? "border-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <img src={product.image} alt="Principal" className="w-full h-full object-contain" />
                </button>
                {product.images.map((img: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(img)}
                    className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                      selectedImage === img ? "border-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img src={img} alt={`Foto ${index + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-sm text-primary font-medium">{product.category}</span>
              <h1 className="text-2xl sm:text-3xl font-display font-bold mt-2">{product.name}</h1>
            </div>

            <div className="flex items-center gap-2">
              {renderStars(parseFloat(String(reviewsData?.avgRating || 0)))}
              <span className="text-muted-foreground">
                ({parseFloat(String(reviewsData?.avgRating || 0)).toFixed(1)}) - {reviewsData?.reviews.length || 0} avaliações
              </span>
            </div>

            <p className="text-muted-foreground text-lg">{product.description}</p>

            {variations && variations.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Tamanho/Opção:</label>
                <div className="flex flex-wrap gap-2">
                  {variations.map((v) => (
                    <Button
                      key={v.id}
                      variant={selectedVariation?.id === v.id ? "default" : "outline"}
                      className={`${
                        selectedVariation?.id === v.id 
                          ? "bg-primary text-black hover:bg-primary/90" 
                          : "border-border hover:border-primary"
                      } ${!v.inStock ? "opacity-50 line-through" : ""}`}
                      onClick={() => setSelectedVariation(v)}
                      data-testid={`variation-${v.id}`}
                    >
                      {v.label} - R$ {v.price.toFixed(2)}
                      {!v.inStock && " (Sem estoque)"}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="text-3xl sm:text-4xl font-bold text-primary">
              R$ {currentPrice.toFixed(2)}
            </div>

            {(() => {
              const hasVariations = variations && variations.length > 0;
              const isSelectedOutOfStock = hasVariations 
                ? (selectedVariation ? !selectedVariation.inStock : false)
                : !product.inStock;
              const allVariationsOutOfStock = hasVariations && variations.every(v => !v.inStock);
              const isOutOfStock = allVariationsOutOfStock || isSelectedOutOfStock;
              
              return (
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-bold">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={isOutOfStock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    className={`flex-1 font-bold ${
                      isOutOfStock 
                        ? "bg-gray-500 text-white cursor-not-allowed" 
                        : "bg-primary text-black hover:bg-primary/90"
                    }`}
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    data-testid="button-add-to-cart"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {isOutOfStock ? "Sem Estoque" : "Adicionar ao Carrinho"}
                  </Button>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-display font-bold">Avaliações</h2>

          {customer ? (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Deixe sua avaliação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sua nota:</label>
                  {renderStars(rating, true)}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comentário (opcional):</label>
                  <Textarea
                    placeholder="Conte sua experiência com o produto..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    data-testid="input-review-comment"
                  />
                </div>
                <Button
                  className="bg-primary text-black hover:bg-primary/90"
                  onClick={handleSubmitReview}
                  disabled={createReviewMutation.isPending}
                  data-testid="button-submit-review"
                >
                  Enviar Avaliação
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Faça login para deixar sua avaliação
                </p>
                <Link href="/conta">
                  <Button variant="outline">Entrar na conta</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {reviewsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : reviewsData?.reviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Ainda não há avaliações para este produto.
            </p>
          ) : (
            <div className="space-y-4">
              {reviewsData?.reviews.map(review => (
                <Card key={review.id} className="bg-card border-border" data-testid={`review-${review.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold">{review.customerName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? "fill-primary text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
