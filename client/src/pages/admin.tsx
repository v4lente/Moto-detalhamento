import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchProducts, createProduct, updateProduct, deleteProduct,
  fetchSettings, updateSettings, getCurrentUser, logout 
} from "@/lib/api";
import { Product, SiteSettings } from "@shared/schema";
import { Plus, Pencil, Trash2, LogOut, Settings, Package, Loader2 } from "lucide-react";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user"],
    queryFn: getCurrentUser,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  useEffect(() => {
    if (!userLoading && !user) {
      setLocation("/login");
    }
  }, [user, userLoading, setLocation]);

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto criado com sucesso!" });
      setIsProductDialogOpen(false);
    },
    onError: () => toast({ title: "Erro ao criar produto", variant: "destructive" }),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Product> }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto atualizado!" });
      setEditingProduct(null);
      setIsProductDialogOpen(false);
    },
    onError: () => toast({ title: "Erro ao atualizar produto", variant: "destructive" }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto removido!" });
    },
    onError: () => toast({ title: "Erro ao remover produto", variant: "destructive" }),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Configurações salvas!" });
    },
    onError: () => toast({ title: "Erro ao salvar configurações", variant: "destructive" }),
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const handleProductSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: parseFloat(formData.get("price") as string),
      image: formData.get("image") as string,
      category: formData.get("category") as string,
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const handleSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const settingsData: Partial<SiteSettings> = {
      whatsappNumber: formData.get("whatsappNumber") as string,
      siteName: formData.get("siteName") as string,
      siteTagline: formData.get("siteTagline") as string,
      heroTitle: formData.get("heroTitle") as string,
      heroSubtitle: formData.get("heroSubtitle") as string,
      footerText: formData.get("footerText") as string,
      copyrightText: formData.get("copyrightText") as string,
      logoImage: formData.get("logoImage") as string,
      backgroundImage: formData.get("backgroundImage") as string,
    };
    updateSettingsMutation.mutate(settingsData);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40 bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="font-display font-bold text-xl uppercase tracking-widest">
            <span className="text-primary">Admin</span> Panel
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Olá, {user.username}</span>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-card">
            <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <Package className="h-4 w-4 mr-2" /> Produtos
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <Settings className="h-4 w-4 mr-2" /> Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-display font-bold">Gerenciar Produtos</h2>
              <Dialog open={isProductDialogOpen} onOpenChange={(open) => {
                setIsProductDialogOpen(open);
                if (!open) setEditingProduct(null);
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-black hover:bg-primary/90" data-testid="button-add-product">
                    <Plus className="h-4 w-4 mr-2" /> Novo Produto
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-primary/20 max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-display">
                      {editingProduct ? "Editar Produto" : "Novo Produto"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input id="name" name="name" defaultValue={editingProduct?.name} required data-testid="input-product-name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea id="description" name="description" defaultValue={editingProduct?.description} required data-testid="input-product-description" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Preço (R$)</Label>
                        <Input id="price" name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required data-testid="input-product-price" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Categoria</Label>
                        <Input id="category" name="category" defaultValue={editingProduct?.category} required data-testid="input-product-category" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image">URL da Imagem</Label>
                      <Input id="image" name="image" defaultValue={editingProduct?.image} required data-testid="input-product-image" />
                    </div>
                    <Button type="submit" className="w-full bg-primary text-black hover:bg-primary/90" data-testid="button-save-product">
                      {editingProduct ? "Atualizar" : "Criar"} Produto
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {productsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4">
                {products?.map((product) => (
                  <Card key={product.id} className="bg-card border-border" data-testid={`admin-product-${product.id}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-16 w-16 bg-background rounded overflow-hidden border border-border">
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.category} • R$ {product.price.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingProduct(product);
                            setIsProductDialogOpen(true);
                          }}
                          data-testid={`button-edit-${product.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => deleteProductMutation.mutate(product.id)}
                          data-testid={`button-delete-${product.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-display">Configurações do Site</CardTitle>
                <CardDescription>Personalize as informações exibidas no site</CardDescription>
              </CardHeader>
              <CardContent>
                {settingsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <form onSubmit={handleSettingsSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="whatsappNumber">Número do WhatsApp</Label>
                        <Input id="whatsappNumber" name="whatsappNumber" defaultValue={settings?.whatsappNumber} placeholder="5511999999999" data-testid="input-whatsapp" />
                        <p className="text-xs text-muted-foreground">Formato: 55 + DDD + Número (sem espaços)</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="siteName">Nome do Site</Label>
                        <Input id="siteName" name="siteName" defaultValue={settings?.siteName} data-testid="input-site-name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="siteTagline">Slogan</Label>
                        <Input id="siteTagline" name="siteTagline" defaultValue={settings?.siteTagline} data-testid="input-tagline" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="heroTitle">Título Principal</Label>
                        <Input id="heroTitle" name="heroTitle" defaultValue={settings?.heroTitle} data-testid="input-hero-title" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heroSubtitle">Subtítulo Principal</Label>
                      <Textarea id="heroSubtitle" name="heroSubtitle" defaultValue={settings?.heroSubtitle} data-testid="input-hero-subtitle" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footerText">Texto do Rodapé</Label>
                      <Textarea id="footerText" name="footerText" defaultValue={settings?.footerText} data-testid="input-footer-text" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="copyrightText">Texto de Copyright</Label>
                      <Input id="copyrightText" name="copyrightText" defaultValue={settings?.copyrightText} data-testid="input-copyright" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="logoImage">URL do Logo</Label>
                        <Input id="logoImage" name="logoImage" defaultValue={settings?.logoImage || ""} data-testid="input-logo" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="backgroundImage">URL da Imagem de Fundo</Label>
                        <Input id="backgroundImage" name="backgroundImage" defaultValue={settings?.backgroundImage || ""} data-testid="input-background" />
                      </div>
                    </div>
                    <Button type="submit" className="bg-primary text-black hover:bg-primary/90 font-bold" data-testid="button-save-settings">
                      Salvar Configurações
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
