import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { fetchProduct, fetchProductReviews, createReview, getCurrentCustomer } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Star, ArrowLeft, Plus, Minus, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Produto() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id || "0");
  const { toast } = useToast();
  const { addToCart } = useCart();
  const queryClient = useQueryClient();
  
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
    enabled: productId > 0,
  });

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
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

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
            <Link href="/">
              <Button variant="outline" size="icon">
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="aspect-square rounded-lg overflow-hidden border border-border">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-sm text-primary font-medium">{product.category}</span>
              <h1 className="text-3xl font-display font-bold mt-2">{product.name}</h1>
            </div>

            <div className="flex items-center gap-2">
              {renderStars(reviewsData?.avgRating || 0)}
              <span className="text-muted-foreground">
                ({reviewsData?.avgRating.toFixed(1) || "0.0"}) - {reviewsData?.reviews.length || 0} avaliações
              </span>
            </div>

            <p className="text-muted-foreground text-lg">{product.description}</p>

            <div className="text-4xl font-bold text-primary">
              R$ {product.price.toFixed(2)}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center border border-border rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                className="flex-1 bg-primary text-black hover:bg-primary/90 font-bold"
                onClick={handleAddToCart}
                data-testid="button-add-to-cart"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Adicionar ao Carrinho
              </Button>
            </div>
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
