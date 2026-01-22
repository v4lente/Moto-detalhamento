import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { login, register } from "@/lib/api";
import { Lock, User } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegister) {
        await register(username, password);
        toast({ title: "Conta criada com sucesso!" });
      } else {
        await login(username, password);
        toast({ title: "Login realizado com sucesso!" });
      }
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      setLocation("/admin");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha na autenticação",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl uppercase tracking-widest">
            <span className="text-primary">Admin</span> Panel
          </CardTitle>
          <CardDescription>
            {isRegister ? "Criar nova conta de administrador" : "Faça login para acessar o painel"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  className="pl-10"
                  required
                  data-testid="input-username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="pl-10"
                  required
                  data-testid="input-password"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-black hover:bg-primary/90 font-bold"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? "Carregando..." : isRegister ? "Criar Conta" : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              className="text-muted-foreground"
              onClick={() => setIsRegister(!isRegister)}
              data-testid="button-toggle-mode"
            >
              {isRegister ? "Já tem uma conta? Faça login" : "Não tem conta? Registre-se"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
