import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { customerLogin, type CustomerData } from "@/shared/lib/api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Loader2, Lock, Mail } from "lucide-react";

export function CustomerLoginForm({ onSuccess }: { onSuccess: (customer: CustomerData) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const mutation = useMutation({ mutationFn: () => customerLogin(email, password), onSuccess });
  return <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }} className="space-y-4">
    <div className="space-y-2"><Label htmlFor="checkout-login-email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="checkout-login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required /></div></div>
    <div className="space-y-2"><Label htmlFor="checkout-login-password">Senha</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="checkout-login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required /></div></div>
    {mutation.error && <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>}
    <Button type="submit" className="w-full" disabled={mutation.isPending}>{mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar e continuar"}</Button>
  </form>;
}
