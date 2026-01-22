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
  fetchCustomerOrders, fetchSettings 
} from "@/lib/api";
import { Navbar, Footer } from "@/components/layout";
import { Lock, User, Mail, Phone, MapPin, Home, LogOut, Package, Loader2 } from "lucide-react";
import type { Order } from "@shared/schema";

export default function Conta() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  });

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
                      <div 
                        key={order.id} 
                        className="border border-border/40 rounded-lg p-4 hover:border-primary/40 transition-colors"
                        data-testid={`order-${order.id}`}
                      >
                        <div className="flex items-center justify-between">
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
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Você ainda não fez nenhum pedido.</p>
                    <Button variant="link" className="text-primary mt-2" onClick={() => setLocation("/")}>
                      Começar a comprar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer settings={settings} />
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
              <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-black">
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
            <Button variant="link" className="text-muted-foreground" onClick={() => setLocation("/")}>
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
