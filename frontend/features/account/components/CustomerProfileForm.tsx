import { useState } from "react";
import type { CustomerData } from "@/shared/lib/api";
import { updateCustomerProfile } from "@/shared/lib/api";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { CustomerDocumentFields, CustomerPhoneInput } from "@/shared/components/customer-fields";

export function CustomerProfileForm({ customer, onSuccess }: { customer: CustomerData; onSuccess: (customer: CustomerData) => void }) {
  const [form, setForm] = useState({ name: customer.name, phone: customer.phone, documentType: customer.documentType || "cpf", document: "", address: customer.address || { street: "", number: "", complement: "", neighborhood: "", city: "", state: "", postalCode: "" } });
  const mutation = useMutation({ mutationFn: () => {
    const { document, documentType, ...base } = form;
    return updateCustomerProfile({ ...base, ...(!customer.documentMasked && document ? { document, documentType } : {}) } as any);
  }, onSuccess });
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const setAddress = (key: string, value: string) => setForm((current) => ({ ...current, address: { ...current.address, [key]: value } }));
  return <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}><div><Label>Nome</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></div><div><Label>Telefone</Label><CustomerPhoneInput value={form.phone} onValueChange={(value) => set("phone", value)} /></div>{!customer.documentMasked && <CustomerDocumentFields documentType={form.documentType as "cpf" | "cnpj"} document={form.document} onDocumentTypeChange={(value) => set("documentType", value)} onDocumentChange={(value) => set("document", value)} required /> }<div className="grid grid-cols-[1fr_100px] gap-2"><div><Label>Rua</Label><Input value={form.address.street} onChange={(e) => setAddress("street", e.target.value)} required /></div><div><Label>Número</Label><Input value={form.address.number} onChange={(e) => setAddress("number", e.target.value)} required /></div></div><div><Label>Complemento</Label><Input value={form.address.complement || ""} onChange={(e) => setAddress("complement", e.target.value)} /></div><div className="grid grid-cols-2 gap-2"><div><Label>Bairro</Label><Input value={form.address.neighborhood} onChange={(e) => setAddress("neighborhood", e.target.value)} required /></div><div><Label>CEP</Label><Input value={form.address.postalCode} onChange={(e) => setAddress("postalCode", e.target.value)} required /></div></div><div className="grid grid-cols-[1fr_70px] gap-2"><div><Label>Cidade</Label><Input value={form.address.city} onChange={(e) => setAddress("city", e.target.value)} required /></div><div><Label>UF</Label><Input maxLength={2} value={form.address.state} onChange={(e) => setAddress("state", e.target.value)} required /></div></div><Button type="submit" disabled={mutation.isPending}>Salvar perfil</Button>{mutation.error && <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>}</form>;
}
