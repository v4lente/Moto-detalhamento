import { Navbar, Footer } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/api";
import logo from "@assets/WhatsApp_Image_2026-01-21_at_22.14.47_1769044534872.jpeg";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: products, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <section className="relative h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent z-10" />
          <img 
            src={logo} 
            alt="Moto Detailing Studio" 
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-20">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-display font-bold uppercase italic leading-none mb-6">
              Estética <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-200">
                Premium
              </span>
            </h1>
            <p className="text-lg text-gray-300 mb-8 max-w-lg">
              Cuidado profissional para sua moto. Utilizamos e vendemos apenas os melhores produtos do mercado mundial.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-wider text-base px-8" data-testid="button-ver-produtos">
                Ver Produtos
              </Button>
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
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
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

      <Footer />
    </div>
  );
}
