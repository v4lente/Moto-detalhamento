import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  customerLogin, customerRegister, customerLogout, getCurrentCustomer, 
  fetchCustomerOrders, fetchCustomerOrder, fetchSettings, updateCustomerProfile
} from "@/lib/api";
import { Navbar, Footer } from "@/components/layout";
import { Lock, User, Mail, Phone, MapPin, Home, LogOut, Package, Loader2, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Order, OrderItem } from "@shared/schema";

export default function Conta() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedOrders, setExpandedOrders] = useState<Record<number, OrderItem[]>>({});
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: "",
    phone: "",
    deliveryAddress: "",
  });

  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ["customer"],
    queryFn: getCurrentCustomer,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["customerOrders"],
    queryFn: fetchCustomerOrders,
    enabled: !!customer,
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const logoutMutation = useMutation({
    mutationFn: customerLogout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
      toast({ title: "Logout realizado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateCustomerProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      toast({ title: "Perfil atualizado!" });
      setIsProfileDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleToggleOrder = async (orderId: number) => {
    if (expandedOrders[orderId]) {
      setExpandedOrders(prev => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
    } else {
      setLoadingOrderId(orderId);
      try {
        const orderDetails = await fetchCustomerOrder(orderId);
        setExpandedOrders(prev => ({
          ...prev,
          [orderId]: orderDetails.items,
        }));
      } catch (error) {
        toast({ title: "Erro ao carregar detalhes do pedido", variant: "destructive" });
      } finally {
        setLoadingOrderId(null);
      }
    }
  };

  const handleOpenProfileEdit = () => {
    if (customer) {
      setProfileFormData({
        name: customer.name,
        phone: customer.phone,
        deliveryAddress: customer.deliveryAddress || "",
      });
      setIsProfileDialogOpen(true);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileFormData);
  };

  if (customerLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer settings={settings} />
      </div>
    );
  }

  if (customer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-display text-3xl font-bold uppercase tracking-widest">
                  Olá, <span className="text-primary">{customer.name}</span>
                </h1>
                <p className="text-muted-foreground mt-1">{customer.email}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleOpenProfileEdit} data-testid="button-edit-profile">
                  <Pencil className="h-4 w-4 mr-2" /> Editar Perfil
                </Button>
                <Button variant="outline" onClick={() => setLocation("/")} data-testid="link-home">
                  <Home className="h-4 w-4 mr-2" /> Loja
                </Button>
                <Button variant="outline" onClick={() => logoutMutation.mutate()} data-testid="button-logout">
                  <LogOut className="h-4 w-4 mr-2" /> Sair
                </Button>
              </div>
            </div>

            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Meus Pedidos
                </CardTitle>
                <CardDescription>Histórico de todos os seus pedidos</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : orders && orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order: Order) => (
                      <Collapsible 
                        key={order.id}
                        open={!!expandedOrders[order.id]}
                        onOpenChange={() => handleToggleOrder(order.id)}
                      >
                        <div 
                          className="border border-border/40 rounded-lg overflow-hidden hover:border-primary/40 transition-colors"
                          data-testid={`order-${order.id}`}
                        >
                          <CollapsibleTrigger asChild>
                            <button className="w-full p-4 flex items-center justify-between text-left hover:bg-background/50 transition-colors">
                              <div>
                                <p className="font-medium">Pedido #{order.id}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-bold text-primary">R$ {order.total.toFixed(2)}</p>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    order.status === "completed" 
                                      ? "bg-green-500/20 text-green-500" 
                                      : order.status === "cancelled"
                                      ? "bg-red-500/20 text-red-500"
                                      : "bg-yellow-500/20 text-yellow-500"
                                  }`}>
                                    {order.status === "pending" ? "Pendente" : 
                                     order.status === "completed" ? "Concluído" : 
                                     order.status === "cancelled" ? "Cancelado" : order.status}
                                  </span>
                                </div>
                                {loadingOrderId === order.id ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                ) : expandedOrders[order.id] ? (
                                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            {expandedOrders[order.id] && (
                              <div className="px-4 pb-4 border-t border-border/40 pt-4 bg-background/30">
                                <p className="font-medium mb-2 text-sm">Itens do pedido:</p>
                                <div className="space-y-2">
                                  {expandedOrders[order.id].map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm" data-testid={`order-item-${item.id}`}>
                                      <span>{item.quantity}x {item.productName}</span>
                                      <span className="text-primary">R$ {(item.productPrice * item.quantity).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Você ainda não fez nenhum pedido.</p>
                    <Button variant="link" className="text-primary mt-2" onClick={() => setLocation("/")} data-testid="link-start-shopping">
                      Começar a comprar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer settings={settings} />

        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="sm:max-w-md bg-card border-primary/20" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="font-display uppercase tracking-widest text-primary">
                Editar Perfil
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="profile-name"
                    value={profileFormData.name}
                    onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                    className="pl-10"
                    required
                    data-testid="input-profile-name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="profile-phone"
                    value={profileFormData.phone}
                    onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                    className="pl-10"
                    required
                    data-testid="input-profile-phone"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-address">Endereço de Entrega</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="profile-address"
                    value={profileFormData.deliveryAddress}
                    onChange={(e) => setProfileFormData({ ...profileFormData, deliveryAddress: e.target.value })}
                    className="pl-10"
                    placeholder="Rua, número, bairro, cidade"
                    data-testid="input-profile-address"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-black hover:bg-primary/90 font-bold"
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Alterações"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-card">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-black" data-testid="tab-login">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-black" data-testid="tab-register">
                Cadastrar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm />
            </TabsContent>

            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Button variant="link" className="text-muted-foreground" onClick={() => setLocation("/")} data-testid="link-back-store">
              <Home className="h-4 w-4 mr-2" /> Voltar para a loja
            </Button>
          </div>
        </div>
      </main>
      <Footer settings={settings} />
    </div>
  );
}

function LoginForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: () => customerLogin(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      toast({ title: "Login realizado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <Card className="bg-card border-primary/20 mt-4">
      <CardHeader>
        <CardTitle className="font-display uppercase tracking-widest">
          <span className="text-primary">Bem-vindo</span> de volta
        </CardTitle>
        <CardDescription>Entre com seu email e senha</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="pl-10"
                required
                data-testid="input-login-email"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="pl-10"
                required
                data-testid="input-login-password"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-primary text-black hover:bg-primary/90 font-bold"
            disabled={loginMutation.isPending}
            data-testid="button-login"
          >
            {loginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RegisterForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    deliveryAddress: "",
  });

  const registerMutation = useMutation({
    mutationFn: () => customerRegister(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      toast({ title: "Conta criada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate();
  };

  return (
    <Card className="bg-card border-primary/20 mt-4">
      <CardHeader>
        <CardTitle className="font-display uppercase tracking-widest">
          <span className="text-primary">Criar</span> conta
        </CardTitle>
        <CardDescription>Cadastre-se para acompanhar seus pedidos</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="register-name">Nome completo *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="register-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome"
                className="pl-10"
                required
                data-testid="input-register-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="register-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                className="pl-10"
                required
                data-testid="input-register-email"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-phone">Telefone *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="register-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="11999999999"
                className="pl-10"
                required
                data-testid="input-register-phone"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">Senha *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="register-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="pl-10"
                required
                minLength={6}
                data-testid="input-register-password"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-address">Endereço de entrega (opcional)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="register-address"
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                placeholder="Rua, número, bairro, cidade"
                className="pl-10"
                data-testid="input-register-address"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-primary text-black hover:bg-primary/90 font-bold"
            disabled={registerMutation.isPending}
            data-testid="button-register"
          >
            {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Conta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
