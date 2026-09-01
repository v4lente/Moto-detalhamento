import { Button } from "@/shared/ui/button";
import { CheckCircle2, History, Phone } from "lucide-react";
import { Link } from "wouter";

export function CheckoutConfirmation({ reference, whatsappShareUrl, onClose }: { reference: string; whatsappShareUrl?: string | null; onClose: () => void }) {
  return <div className="space-y-5 text-center" data-testid="checkout-success-feedback"><CheckCircle2 className="mx-auto h-12 w-12 text-green-600" /><h2 className="font-display text-xl uppercase text-primary">Pedido salvo com sucesso</h2><p className="text-sm text-muted-foreground">Sua referência é <strong className="text-foreground">{reference}</strong>. Você pode acompanhar tudo no histórico.</p><div className="grid gap-2"><Link href="/conta"><Button variant="outline" className="w-full"><History className="mr-2 h-4 w-4" /> Ver histórico</Button></Link>{whatsappShareUrl && <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => window.open(whatsappShareUrl, "_blank", "noopener,noreferrer")}><Phone className="mr-2 h-4 w-4" /> Compartilhar pelo WhatsApp</Button>}<Button className="w-full" onClick={onClose}>Continuar comprando</Button></div></div>;
}
