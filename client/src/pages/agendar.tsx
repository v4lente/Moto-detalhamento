import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createAppointment, fetchSettings, getCurrentCustomer } from "@/lib/api";
import { Loader2, Calendar, AlertTriangle, CheckCircle, MessageCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Link } from "wouter";

export default function Agendar() {
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState("");
  const [preferredDate, setPreferredDate] = useState<Date | undefined>(undefined);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const { data: customer } = useQuery({
    queryKey: ["currentCustomer"],
    queryFn: getCurrentCustomer,
  });

  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: (data) => {
      setSuccess(true);
      
      const whatsappMessage = encodeURIComponent(
        `🏍️ *Pré-Agendamento de Serviço*\n\n` +
        `Olá! Acabei de solicitar um pré-agendamento pelo site.\n\n` +
        `Aguardo retorno para análise do veículo e confirmação da data.`
      );
      const whatsappUrl = `https://wa.me/${data.whatsappNumber.replace(/\D/g, '')}?text=${whatsappMessage}`;
      setWhatsappLink(whatsappUrl);
      
      toast({
        title: "Pré-agendamento enviado!",
        description: "Entraremos em contato em breve para confirmar.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!preferredDate) {
      toast({
        title: "Data obrigatória",
        description: "Por favor, selecione a data e hora preferencial.",
        variant: "destructive",
      });
      return;
    }
    
    createMutation.mutate({
      vehicleInfo: formData.get("vehicleInfo") as string,
      serviceDescription: formData.get("serviceDescription") as string,
      preferredDate: preferredDate.toISOString(),
      customerName: customer ? undefined : formData.get("customerName") as string,
      customerPhone: customer ? undefined : formData.get("customerPhone") as string,
      customerEmail: customer ? undefined : formData.get("customerEmail") as string,
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-base sm:text-xl font-display font-bold text-primary truncate max-w-[120px] sm:max-w-none">
                {settings?.siteName || "Agendamento"}
              </h1>
              <div className="w-10" />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-xl mx-auto">
            <Card className="bg-card border-primary/30">
              <CardContent className="pt-8 text-center">
                <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-display font-bold mb-4">Pré-Agendamento Enviado!</h2>
                <p className="text-muted-foreground mb-6">
                  Recebemos sua solicitação. Entraremos em contato em breve para analisar seu veículo e confirmar a data e valor do serviço.
                </p>
                
                <Alert className="mb-6 bg-yellow-500/10 border-yellow-500/30">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertTitle className="text-yellow-500">Importante</AlertTitle>
                  <AlertDescription>
                    Este é um <strong>pré-agendamento</strong>. A confirmação definitiva só ocorre após análise presencial do veículo.
                  </AlertDescription>
                </Alert>

                {whatsappLink && (
                  <Button
                    asChild
                    className="w-full bg-green-600 hover:bg-green-700 text-white mb-4"
                  >
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Enviar mensagem no WhatsApp
                    </a>
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setSuccess(false)}
                  className="w-full"
                >
                  Fazer novo agendamento
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-base sm:text-xl font-display font-bold text-primary truncate max-w-[120px] sm:max-w-none">
              {settings?.siteName || "Agendamento"}
            </h1>
            <div className="w-10" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-display font-bold uppercase mb-2">Agendar Serviço</h2>
            <p className="text-muted-foreground">Solicite um pré-agendamento para seu serviço de detalhamento</p>
          </div>

          <Alert className="mb-8 bg-yellow-500/10 border-yellow-500/30">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-500">Atenção: Pré-Agendamento</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Este formulário cria um <strong>pedido de pré-agendamento</strong>. É imprescindível que seja feita uma análise presencial da sua moto antes de confirmar a data e informar o valor correto do serviço.
            </AlertDescription>
          </Alert>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Solicitar Pré-Agendamento
              </CardTitle>
              <CardDescription>
                Preencha os dados abaixo e entraremos em contato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {!customer && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold">Seus Dados</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customerName">Nome Completo *</Label>
                        <Input
                          id="customerName"
                          name="customerName"
                          required
                          className="bg-background"
                          data-testid="input-customer-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customerPhone">Telefone/WhatsApp *</Label>
                        <Input
                          id="customerPhone"
                          name="customerPhone"
                          type="tel"
                          required
                          placeholder="(00) 00000-0000"
                          className="bg-background"
                          data-testid="input-customer-phone"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">Email (opcional)</Label>
                      <Input
                        id="customerEmail"
                        name="customerEmail"
                        type="email"
                        className="bg-background"
                        data-testid="input-customer-email"
                      />
                    </div>
                  </div>
                )}

                {customer && (
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                    <p className="text-sm">
                      Agendando como: <strong>{customer.name}</strong> ({customer.phone})
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleInfo">Veículo *</Label>
                    <Input
                      id="vehicleInfo"
                      name="vehicleInfo"
                      required
                      placeholder="Ex: Harley Davidson Sportster 883 2020"
                      className="bg-background"
                      data-testid="input-vehicle-info"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceDescription">Descrição do Serviço Desejado *</Label>
                    <Textarea
                      id="serviceDescription"
                      name="serviceDescription"
                      required
                      rows={4}
                      placeholder="Descreva o serviço que você deseja (lavagem completa, polimento, proteção cerâmica, etc.)"
                      className="bg-background resize-none"
                      data-testid="input-service-description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredDate">Data e Hora Preferencial *</Label>
                    <DateTimePicker
                      value={preferredDate}
                      onChange={setPreferredDate}
                      placeholder="Selecione data e hora"
                      minDate={new Date()}
                      data-testid="input-preferred-date"
                    />
                    <p className="text-xs text-muted-foreground">
                      Esta é apenas uma preferência. A data final será confirmada após análise.
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-black hover:bg-primary/90 font-bold py-6"
                  disabled={createMutation.isPending}
                  data-testid="button-submit-appointment"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-5 w-5 mr-2 text-black" />
                      Solicitar Pré-Agendamento
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
