import { Navbar, Footer } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import { products } from "@/data/products";
import { Button } from "@/components/ui/button";
import logo from "@assets/WhatsApp_Image_2026-01-21_at_22.14.47_1769044534872.jpeg";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
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
              <Button size="lg" className="bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-wider text-base px-8">
                Ver Produtos
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold uppercase tracking-wider text-base px-8">
                Agendar Serviço
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section className="py-20 container mx-auto px-4 flex-1">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-display font-bold uppercase mb-2">Loja Oficial</h2>
            <p className="text-muted-foreground">Produtos profissionais para você cuidar da sua máquina em casa.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
