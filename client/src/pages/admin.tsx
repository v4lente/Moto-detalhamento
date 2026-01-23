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
  fetchSettings, updateSettings, getCurrentUser, logout,
  fetchAllOrders, fetchOrderDetails, updateOrderStatus,
  fetchAllCustomers, createAdminCustomer, updateAdminCustomer, deleteAdminCustomer,
  fetchAllUsers, createAdminUser, updateAdminUser, deleteAdminUser, SafeUser,
  fetchServicePosts, createServicePost, updateServicePost, deleteServicePost
} from "@/lib/api";
import { Product, UpdateSiteSettings, Order, OrderItem, Customer, ServicePost } from "@shared/schema";
import { Plus, Pencil, Trash2, LogOut, Settings, Package, Loader2, Home, ShoppingBag, Eye, Check, X, Clock, Users, User, Phone, Mail, MapPin, Shield, Key, Camera, Play, Image } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { items: OrderItem[] }) | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SafeUser | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [productImage, setProductImage] = useState("");
  const [logoImage, setLogoImage] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [editingServicePost, setEditingServicePost] = useState<ServicePost | null>(null);
  const [isServicePostDialogOpen, setIsServicePostDialogOpen] = useState(false);
  const [serviceMediaUrls, setServiceMediaUrls] = useState<string[]>([]);
  const [serviceMediaTypes, setServiceMediaTypes] = useState<string[]>([]);

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

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["adminOrders"],
    queryFn: fetchAllOrders,
  });

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["adminCustomers"],
    queryFn: fetchAllCustomers,
  });

  const { data: adminUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: fetchAllUsers,
  });

  const { data: servicePosts, isLoading: servicePostsLoading } = useQuery({
    queryKey: ["servicePosts"],
    queryFn: fetchServicePosts,
  });

  useEffect(() => {
    if (!userLoading && !user) {
      setLocation("/login");
    }
  }, [user, userLoading, setLocation]);

  useEffect(() => {
    if (settings) {
      setLogoImage(settings.logoImage || "");
      setBackgroundImage(settings.backgroundImage || "");
    }
  }, [settings]);

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

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      toast({ title: "Status do pedido atualizado!" });
    },
    onError: () => toast({ title: "Erro ao atualizar status", variant: "destructive" }),
  });

  const createCustomerMutation = useMutation({
    mutationFn: createAdminCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCustomers"] });
      toast({ title: "Cliente criado com sucesso!" });
      setIsCustomerDialogOpen(false);
    },
    onError: (error: Error) => toast({ title: "Erro", description: error.message, variant: "destructive" }),
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAdminCustomer>[1] }) => updateAdminCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCustomers"] });
      toast({ title: "Cliente atualizado!" });
      setEditingCustomer(null);
      setIsCustomerDialogOpen(false);
    },
    onError: () => toast({ title: "Erro ao atualizar cliente", variant: "destructive" }),
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: deleteAdminCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCustomers"] });
      toast({ title: "Cliente removido!" });
    },
    onError: () => toast({ title: "Erro ao remover cliente", variant: "destructive" }),
  });

  const createUserMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setIsUserDialogOpen(false);
      toast({ title: "Usuário criado com sucesso!" });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAdminUser>[1] }) =>
      updateAdminUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setIsUserDialogOpen(false);
      setEditingUser(null);
      toast({ title: "Usuário atualizado!" });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: "Usuário removido!" });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const createServicePostMutation = useMutation({
    mutationFn: createServicePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicePosts"] });
      queryClient.invalidateQueries({ queryKey: ["featuredServicePosts"] });
      toast({ title: "Post de serviço criado com sucesso!" });
      setIsServicePostDialogOpen(false);
      setServiceMediaUrls([]);
      setServiceMediaTypes([]);
    },
    onError: () => toast({ title: "Erro ao criar post de serviço", variant: "destructive" }),
  });

  const updateServicePostMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ServicePost> }) => updateServicePost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicePosts"] });
      queryClient.invalidateQueries({ queryKey: ["featuredServicePosts"] });
      toast({ title: "Post de serviço atualizado!" });
      setEditingServicePost(null);
      setIsServicePostDialogOpen(false);
      setServiceMediaUrls([]);
      setServiceMediaTypes([]);
    },
    onError: () => toast({ title: "Erro ao atualizar post de serviço", variant: "destructive" }),
  });

  const deleteServicePostMutation = useMutation({
    mutationFn: deleteServicePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicePosts"] });
      queryClient.invalidateQueries({ queryKey: ["featuredServicePosts"] });
      toast({ title: "Post de serviço removido!" });
    },
    onError: () => toast({ title: "Erro ao remover post de serviço", variant: "destructive" }),
  });

  const handleAddServiceMedia = (url: string, type: "image" | "video") => {
    setServiceMediaUrls([...serviceMediaUrls, url]);
    setServiceMediaTypes([...serviceMediaTypes, type]);
  };

  const handleRemoveServiceMedia = (index: number) => {
    setServiceMediaUrls(serviceMediaUrls.filter((_, i) => i !== index));
    setServiceMediaTypes(serviceMediaTypes.filter((_, i) => i !== index));
  };

  const handleViewOrder = async (orderId: number) => {
    try {
      const orderDetails = await fetchOrderDetails(orderId);
      setSelectedOrder(orderDetails);
      setIsOrderDialogOpen(true);
    } catch (error) {
      toast({ title: "Erro ao carregar pedido", variant: "destructive" });
    }
  };

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
      image: productImage,
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
    const settingsData: UpdateSiteSettings = {
      whatsappNumber: formData.get("whatsappNumber") as string,
      siteName: formData.get("siteName") as string,
      siteTagline: formData.get("siteTagline") as string,
      heroTitle: formData.get("heroTitle") as string,
      heroSubtitle: formData.get("heroSubtitle") as string,
      footerText: formData.get("footerText") as string,
      copyrightText: formData.get("copyrightText") as string,
      logoImage: logoImage,
      backgroundImage: backgroundImage,
    };
    updateSettingsMutation.mutate(settingsData);
  };

  const handleCustomerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (editingCustomer) {
      const updateData = {
        name: formData.get("name") as string,
        phone: formData.get("phone") as string,
        email: (formData.get("email") as string) || null,
        nickname: (formData.get("nickname") as string) || null,
        deliveryAddress: (formData.get("deliveryAddress") as string) || null,
      };
      updateCustomerMutation.mutate({ id: editingCustomer.id, data: updateData });
    } else {
      const createData = {
        name: formData.get("name") as string,
        phone: formData.get("phone") as string,
        email: (formData.get("email") as string) || undefined,
        nickname: (formData.get("nickname") as string) || undefined,
        deliveryAddress: (formData.get("deliveryAddress") as string) || undefined,
        password: (formData.get("password") as string) || undefined,
      };
      createCustomerMutation.mutate(createData);
    }
  };

  const handleUserSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (editingUser) {
      const updateData: Parameters<typeof updateAdminUser>[1] = {
        username: formData.get("username") as string,
        role: formData.get("role") as "admin" | "viewer",
      };
      const password = formData.get("password") as string;
      if (password) {
        updateData.password = password;
      }
      updateUserMutation.mutate({ id: editingUser.id, data: updateData });
    } else {
      const createData = {
        username: formData.get("username") as string,
        password: formData.get("password") as string,
        role: formData.get("role") as "admin" | "viewer",
      };
      createUserMutation.mutate(createData);
    }
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
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="link-home">
                <Home className="h-4 w-4 mr-2" /> Loja
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-card">
            <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-black" data-testid="tab-products">
              <Package className="h-4 w-4 mr-2" /> Produtos
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-primary data-[state=active]:text-black" data-testid="tab-orders">
              <ShoppingBag className="h-4 w-4 mr-2" /> Pedidos
            </TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-primary data-[state=active]:text-black" data-testid="tab-customers">
              <Users className="h-4 w-4 mr-2" /> Clientes
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-black" data-testid="tab-users">
              <Shield className="h-4 w-4 mr-2" /> Usuários
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-black" data-testid="tab-services">
              <Camera className="h-4 w-4 mr-2" /> Serviços
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-black" data-testid="tab-settings">
              <Settings className="h-4 w-4 mr-2" /> Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-display font-bold">Gerenciar Produtos</h2>
              <Dialog open={isProductDialogOpen} onOpenChange={(open) => {
                setIsProductDialogOpen(open);
                if (!open) {
                  setEditingProduct(null);
                  setProductImage("");
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-black hover:bg-primary/90" data-testid="button-add-product">
                    <Plus className="h-4 w-4 mr-2" /> Novo Produto
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-primary/20 max-w-lg" aria-describedby={undefined}>
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
                      <Label>Imagem do Produto</Label>
                      <ImageUpload value={productImage} onChange={setProductImage} />
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
                            setProductImage(product.image);
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

          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-display font-bold">Gerenciar Pedidos</h2>
            
            {ordersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="bg-card border-border" data-testid={`admin-order-${order.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-bold">Pedido #{order.id}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <div className="hidden md:block">
                              <p className="text-sm text-muted-foreground">Cliente:</p>
                              <p className="font-medium">{order.customerName}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-primary">R$ {order.total.toFixed(2)}</p>
                          </div>
                          <Select
                            defaultValue={order.status}
                            onValueChange={(value) => updateOrderStatusMutation.mutate({ id: order.id, status: value })}
                          >
                            <SelectTrigger className="w-[130px]" data-testid={`select-status-${order.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-yellow-500" /> Pendente
                                </div>
                              </SelectItem>
                              <SelectItem value="completed">
                                <div className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-green-500" /> Concluído
                                </div>
                              </SelectItem>
                              <SelectItem value="cancelled">
                                <div className="flex items-center gap-2">
                                  <X className="h-4 w-4 text-red-500" /> Cancelado
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleViewOrder(order.id)}
                            data-testid={`button-view-order-${order.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Nenhum pedido recebido ainda.</p>
                </CardContent>
              </Card>
            )}

            <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
              <DialogContent className="bg-card border-primary/20 max-w-lg" aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle className="font-display">
                    Detalhes do Pedido #{selectedOrder?.id}
                  </DialogTitle>
                </DialogHeader>
                {selectedOrder && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Cliente</p>
                        <p className="font-medium">{selectedOrder.customerName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Telefone</p>
                        <p className="font-medium">{selectedOrder.customerPhone}</p>
                      </div>
                      {selectedOrder.customerEmail && (
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedOrder.customerEmail}</p>
                        </div>
                      )}
                      {selectedOrder.deliveryAddress && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Endereço</p>
                          <p className="font-medium">{selectedOrder.deliveryAddress}</p>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-border pt-4">
                      <p className="font-medium mb-2">Itens do Pedido</p>
                      <div className="space-y-2">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm" data-testid={`order-item-${item.id}`}>
                            <span>{item.quantity}x {item.productName}</span>
                            <span className="text-primary">R$ {(item.productPrice * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between font-bold mt-4 pt-4 border-t border-border">
                        <span>Total</span>
                        <span className="text-primary">R$ {selectedOrder.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-display font-bold">Gerenciar Clientes</h2>
              <Dialog open={isCustomerDialogOpen} onOpenChange={(open) => {
                setIsCustomerDialogOpen(open);
                if (!open) setEditingCustomer(null);
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-black hover:bg-primary/90" data-testid="button-add-customer">
                    <Plus className="h-4 w-4 mr-2" /> Novo Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-primary/20 max-w-lg" aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle className="font-display">
                      {editingCustomer ? "Editar Cliente" : "Novo Cliente"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCustomerSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="name" name="name" defaultValue={editingCustomer?.name} required className="pl-10" data-testid="input-customer-name" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nickname">Apelido</Label>
                        <Input id="nickname" name="nickname" defaultValue={editingCustomer?.nickname || ""} data-testid="input-customer-nickname" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="phone" name="phone" defaultValue={editingCustomer?.phone} required className="pl-10" data-testid="input-customer-phone" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="email" name="email" type="email" defaultValue={editingCustomer?.email || ""} className="pl-10" data-testid="input-customer-email" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryAddress">Endereço de Entrega</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea id="deliveryAddress" name="deliveryAddress" defaultValue={editingCustomer?.deliveryAddress || ""} className="pl-10" data-testid="input-customer-address" />
                      </div>
                    </div>
                    {!editingCustomer && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha (opcional - permite login)</Label>
                        <Input id="password" name="password" type="password" placeholder="Deixe vazio para cliente sem login" data-testid="input-customer-password" />
                      </div>
                    )}
                    <Button type="submit" className="w-full bg-primary text-black hover:bg-primary/90" data-testid="button-save-customer">
                      {editingCustomer ? "Atualizar" : "Criar"} Cliente
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {customersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : customers && customers.length > 0 ? (
              <div className="grid gap-4">
                {customers.map((customer) => (
                  <Card key={customer.id} className="bg-card border-border" data-testid={`admin-customer-${customer.id}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 bg-background rounded-full flex items-center justify-center border border-border">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">{customer.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {customer.phone} {customer.email && `• ${customer.email}`}
                        </p>
                        {customer.deliveryAddress && (
                          <p className="text-xs text-muted-foreground truncate max-w-md">{customer.deliveryAddress}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {customer.isRegistered && (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-500">
                            Registrado
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingCustomer(customer);
                            setIsCustomerDialogOpen(true);
                          }}
                          data-testid={`button-edit-customer-${customer.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => deleteCustomerMutation.mutate(customer.id)}
                          data-testid={`button-delete-customer-${customer.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Nenhum cliente cadastrado ainda.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-display font-bold">Gerenciar Usuários Admin</h2>
              <Dialog open={isUserDialogOpen} onOpenChange={(open) => {
                setIsUserDialogOpen(open);
                if (!open) setEditingUser(null);
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-black hover:bg-primary/90" data-testid="button-add-user">
                    <Plus className="h-4 w-4 mr-2" /> Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-primary/20 max-w-md" aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle className="font-display">
                      {editingUser ? "Editar Usuário" : "Novo Usuário"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUserSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Nome de Usuário *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="username" name="username" defaultValue={editingUser?.username} required className="pl-10" data-testid="input-user-username" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">{editingUser ? "Nova Senha (deixe vazio para manter)" : "Senha *"}</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="password" name="password" type="password" required={!editingUser} className="pl-10" data-testid="input-user-password" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Perfil *</Label>
                      <Select name="role" defaultValue={editingUser?.role || "admin"}>
                        <SelectTrigger data-testid="select-user-role">
                          <SelectValue placeholder="Selecione o perfil" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin (acesso total)</SelectItem>
                          <SelectItem value="viewer">Visualizador (somente leitura)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full bg-primary text-black hover:bg-primary/90" data-testid="button-save-user">
                      {editingUser ? "Atualizar" : "Criar"} Usuário
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {usersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : adminUsers && adminUsers.length > 0 ? (
              <div className="grid gap-4">
                {adminUsers.map((adminUser) => (
                  <Card key={adminUser.id} className="bg-card border-border" data-testid={`admin-user-${adminUser.id}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 bg-background rounded-full flex items-center justify-center border border-border">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">{adminUser.username}</h3>
                        <p className="text-sm text-muted-foreground">
                          {adminUser.role === "admin" ? "Administrador" : "Visualizador"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          adminUser.role === "admin" 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {adminUser.role === "admin" ? "Admin" : "Viewer"}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingUser(adminUser);
                            setIsUserDialogOpen(true);
                          }}
                          data-testid={`button-edit-user-${adminUser.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {user?.id !== adminUser.id && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => deleteUserMutation.mutate(adminUser.id)}
                            data-testid={`button-delete-user-${adminUser.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Nenhum usuário cadastrado ainda.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-display font-bold">Galeria de Serviços</h2>
              <Dialog open={isServicePostDialogOpen} onOpenChange={(open) => {
                setIsServicePostDialogOpen(open);
                if (!open) {
                  setEditingServicePost(null);
                  setServiceMediaUrls([]);
                  setServiceMediaTypes([]);
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-black hover:bg-primary/90" data-testid="button-add-service">
                    <Plus className="h-4 w-4 mr-2" /> Novo Serviço
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-display">
                      {editingServicePost ? "Editar Serviço" : "Adicionar Serviço"}
                    </DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const postData = {
                        title: formData.get("title") as string,
                        description: formData.get("description") as string || null,
                        clientName: formData.get("clientName") as string || null,
                        vehicleInfo: formData.get("vehicleInfo") as string || null,
                        mediaUrls: serviceMediaUrls,
                        mediaTypes: serviceMediaTypes,
                        featured: formData.get("featured") === "on",
                      };

                      if (editingServicePost) {
                        updateServicePostMutation.mutate({
                          id: editingServicePost.id,
                          data: postData,
                        });
                      } else {
                        createServicePostMutation.mutate(postData);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="title">Título do Serviço *</Label>
                      <Input
                        id="title"
                        name="title"
                        defaultValue={editingServicePost?.title || ""}
                        placeholder="Ex: Detalhamento Completo BMW R1250GS"
                        required
                        className="bg-background"
                        data-testid="input-service-title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        name="description"
                        defaultValue={editingServicePost?.description || ""}
                        placeholder="Descreva o serviço realizado..."
                        className="bg-background min-h-[100px]"
                        data-testid="input-service-description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="clientName">Nome do Cliente</Label>
                        <Input
                          id="clientName"
                          name="clientName"
                          defaultValue={editingServicePost?.clientName || ""}
                          placeholder="Ex: João Silva"
                          className="bg-background"
                          data-testid="input-service-client"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleInfo">Veículo</Label>
                        <Input
                          id="vehicleInfo"
                          name="vehicleInfo"
                          defaultValue={editingServicePost?.vehicleInfo || ""}
                          placeholder="Ex: Harley Davidson Sportster"
                          className="bg-background"
                          data-testid="input-service-vehicle"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Imagens e Vídeos ({serviceMediaUrls.length} adicionado{serviceMediaUrls.length !== 1 ? 's' : ''})</Label>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {serviceMediaUrls.map((url, index) => (
                          <div key={`media-${index}`} className="relative group">
                            {serviceMediaTypes[index] === "image" ? (
                              <img
                                src={url}
                                alt={`Mídia ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-border"
                              />
                            ) : (
                              <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center border border-border">
                                <Play className="h-8 w-8 text-primary" />
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveServiceMedia(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        
                        <div className="w-full h-24">
                          <ImageUpload
                            key={`upload-${serviceMediaUrls.length}`}
                            value=""
                            onChange={(url) => {
                              if (url) handleAddServiceMedia(url, "image");
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Input
                          id="videoUrlInput"
                          placeholder="Cole a URL do vídeo (YouTube, Vimeo)"
                          className="bg-background flex-1"
                          data-testid="input-service-video-url"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const input = document.getElementById("videoUrlInput") as HTMLInputElement;
                            if (input && input.value.trim()) {
                              handleAddServiceMedia(input.value.trim(), "video");
                              input.value = "";
                            }
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Vídeo
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="featured"
                        name="featured"
                        defaultChecked={editingServicePost?.featured || false}
                        className="rounded"
                        data-testid="input-service-featured"
                      />
                      <Label htmlFor="featured">Destacar na página inicial</Label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary text-black hover:bg-primary/90 font-bold"
                      disabled={createServicePostMutation.isPending || updateServicePostMutation.isPending}
                      data-testid="button-save-service"
                    >
                      {(createServicePostMutation.isPending || updateServicePostMutation.isPending) && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {editingServicePost ? "Atualizar" : "Criar"} Serviço
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {servicePostsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : servicePosts && servicePosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servicePosts.map((post) => (
                  <Card key={post.id} className="bg-card border-border overflow-hidden" data-testid={`card-service-${post.id}`}>
                    <div className="aspect-video relative">
                      {post.mediaUrls && post.mediaUrls.length > 0 ? (
                        post.mediaTypes[0] === "video" ? (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Play className="h-12 w-12 text-primary" />
                          </div>
                        ) : (
                          <img
                            src={post.mediaUrls[0]}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Image className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      {post.featured && (
                        <div className="absolute top-2 left-2 bg-primary text-black text-xs font-bold px-2 py-1 rounded">
                          DESTAQUE
                        </div>
                      )}
                      {post.mediaUrls && post.mediaUrls.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          +{post.mediaUrls.length - 1} mídia(s)
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-display font-bold text-lg mb-2">{post.title}</h3>
                      {post.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.description}</p>
                      )}
                      <div className="text-xs text-muted-foreground space-y-1">
                        {post.clientName && <p>Cliente: {post.clientName}</p>}
                        {post.vehicleInfo && <p>Veículo: {post.vehicleInfo}</p>}
                        <p>{new Date(post.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingServicePost(post);
                            setServiceMediaUrls(post.mediaUrls || []);
                            setServiceMediaTypes(post.mediaTypes || []);
                            setIsServicePostDialogOpen(true);
                          }}
                          data-testid={`button-edit-service-${post.id}`}
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteServicePostMutation.mutate(post.id)}
                          data-testid={`button-delete-service-${post.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Excluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
                  <p className="text-sm text-muted-foreground mt-2">Adicione fotos e vídeos dos seus trabalhos!</p>
                </CardContent>
              </Card>
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
                        <Label>Logo</Label>
                        <ImageUpload value={logoImage} onChange={setLogoImage} />
                      </div>
                      <div className="space-y-2">
                        <Label>Imagem de Fundo</Label>
                        <ImageUpload value={backgroundImage} onChange={setBackgroundImage} />
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
