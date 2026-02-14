# F3-T7 - Extrair Logica de Negocio para Services

## Metadata
- **ID**: F3-T7
- **Fase**: 3 - Migracao do Backend
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Extrair logica de negocio complexa das rotas para services dedicados.

## Checklist
- [ ] Criar `backend/services/checkout.service.ts`
- [ ] Criar `backend/services/appointment.service.ts`
- [ ] Mover logica de checkout de orders.routes.ts
- [ ] Mover logica de agendamento de appointments.routes.ts
- [ ] Atualizar rotas para usar services
- [ ] Manter logica simples (CRUD) nas rotas

## Arquivos a Criar

### backend/services/checkout.service.ts
```typescript
import { storage } from "../infrastructure/storage";
import { stripe, createCheckoutSession } from "../infrastructure/payments/stripe.service";
import { sendOrderConfirmation } from "../infrastructure/email/resend.service";

export class CheckoutService {
  async processWhatsAppCheckout(data: CheckoutData): Promise<Order> {
    // Logica de checkout via WhatsApp
  }

  async processStripeCheckout(data: StripeCheckoutData): Promise<{ sessionUrl: string }> {
    // Logica de checkout via Stripe
  }

  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    // Logica de webhook
  }
}

export const checkoutService = new CheckoutService();
```

### backend/services/appointment.service.ts
```typescript
import { storage } from "../infrastructure/storage";
import { sendAppointmentNotification } from "../infrastructure/email/resend.service";

export class AppointmentService {
  async createAppointment(data: CreateAppointment, customerId?: string): Promise<Appointment> {
    // Logica de criacao + notificacao
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment> {
    // Logica de atualizacao + notificacao
  }
}

export const appointmentService = new AppointmentService();
```

## Criterio de Aceite
- Services criados
- Logica complexa extraida das rotas
- Rotas usam services
- Funcionalidade preservada
- Testes passando

## Dependencias
- F3-T6 (split routes)

## Notas
- Manter logica simples (CRUD direto) nas rotas
- Services chamam storage e infrastructure
- Nao criar services para CRUD simples

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
