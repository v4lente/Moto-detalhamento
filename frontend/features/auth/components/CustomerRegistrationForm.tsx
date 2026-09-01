import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { customerRegister, type CustomerData } from "@/shared/lib/api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Loader2 } from "lucide-react";
import { CustomerDocumentFields, CustomerPhoneInput } from "@/shared/components/customer-fields";

const emptyAddress = { street: "", number: "", complement: "", neighborhood: "", city: "", state: "", postalCode: "" };
export function CustomerRegistrationForm({ onSuccess }: { onSuccess: (customer: CustomerData) => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", documentType: "cpf" as "cpf" | "cnpj", document: "", password: "", address: emptyAddress });
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const updateAddress = (key: string, value: string) => setForm((current) => ({ ...current, address: { ...current.address, [key]: value } }));
  const mutation = useMutation({ mutationFn: () => customerRegister(form), onSuccess });
  return <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }} className="space-y-3">
    <div className="space-y-1"><Label>Nome completo / Razão social *</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} required /></div>
    <CustomerDocumentFields documentType={form.documentType} document={form.document} onDocumentTypeChange={(value) => update("documentType", value)} onDocumentChange={(value) => update("document", value)} required />
    <div className="grid grid-cols-2 gap-2"><div className="space-y-1"><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required /></div><div className="space-y-1"><Label>Telefone *</Label><CustomerPhoneInput value={form.phone} onValueChange={(value) => update("phone", value)} required /></div></div>
    <div className="space-y-1"><Label>Senha *</Label><Input type="password" minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} required /></div>
    <div className="grid grid-cols-[1fr_100px] gap-2"><div className="space-y-1"><Label>Rua *</Label><Input value={form.address.street} onChange={(e) => updateAddress("street", e.target.value)} required /></div><div className="space-y-1"><Label>Número *</Label><Input value={form.address.number} onChange={(e) => updateAddress("number", e.target.value)} required /></div></div>
    <div className="space-y-1"><Label>Complemento</Label><Input value={form.address.complement} onChange={(e) => updateAddress("complement", e.target.value)} /></div>
    <div className="grid grid-cols-2 gap-2"><div className="space-y-1"><Label>Bairro *</Label><Input value={form.address.neighborhood} onChange={(e) => updateAddress("neighborhood", e.target.value)} required /></div><div className="space-y-1"><Label>CEP *</Label><Input value={form.address.postalCode} onChange={(e) => updateAddress("postalCode", e.target.value)} required /></div></div>
    <div className="grid grid-cols-[1fr_70px] gap-2"><div className="space-y-1"><Label>Cidade *</Label><Input value={form.address.city} onChange={(e) => updateAddress("city", e.target.value)} required /></div><div className="space-y-1"><Label>UF *</Label><Input maxLength={2} value={form.address.state} onChange={(e) => updateAddress("state", e.target.value)} required /></div></div>
    {mutation.error && <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>}
    <Button type="submit" className="w-full" disabled={mutation.isPending}>{mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta e continuar"}</Button>
  </form>;
}
