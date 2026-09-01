import type { Express } from "express";
import { z } from "zod";
import { storage } from "../../infrastructure/storage";
import { checkoutPreviewSchema, createOrderSchema, orderSearchSchema, orderStatusTransitionSchema } from "@shared/contracts/validation";
import { requireAuth, requireAdmin, requireCustomerAuth } from "../middleware/auth";
import { sendApiError, ApiError } from "../lib/api-error";
import { buildCheckoutPreview } from "../../services/order-pricing.service";
import { buildWhatsAppShare, createPersistedOrder, getOrderPaymentStatus, handleStripeWebhook } from "../../services/checkout.service";
import { getAdminOrder, getCustomerOrder, listAdminOrders, listCustomerOrders, projectOrder } from "../../services/order-query.service";
import { transitionOrder } from "../../services/order-status.service";
import { isStripeConfigured, createCheckoutSession } from "../../infrastructure/payments/stripe.service";
import { revealCustomerDocumentForOrder } from "../../services/customer-fiscal.service";
import { toSafeCustomerProfile } from "../../services/customer-identity.service";

function zodError(res: any, error: unknown) {
  if (error instanceof z.ZodError) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Dados inválidos", details: error.flatten() } });
  return null;
}

async function findOrderByPublicOrLegacyId(value: string) {
  const byReference = await storage.getOrderByReference(value);
  if (byReference) return byReference;
  if (/^\d+$/.test(value)) return storage.getOrder(Number(value));
  return undefined;
}

export function registerOrdersRoutes(app: Express) {
  // O checkout anônimo foi encerrado para impedir pedidos sem identidade persistida.
  app.post("/api/checkout", (_req, res) => res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Faça login para finalizar o pedido" } }));
  app.post("/api/checkout/create-session", (_req, res) => res.status(410).json({ error: { code: "UNSUPPORTED_FLOW", message: "Use o checkout autenticado" } }));

  app.post("/api/checkout/preview", requireCustomerAuth, async (req, res) => {
    try {
      const { items } = checkoutPreviewSchema.parse(req.body);
      res.json(await buildCheckoutPreview(req.session.customerId!, items));
    } catch (error) {
      if (zodError(res, error)) return;
      sendApiError(res, error, "Falha ao calcular o pedido");
    }
  });

  app.post("/api/customer/orders", requireCustomerAuth, async (req, res) => {
    try {
      const idempotencyKey = req.get("idempotency-key") || req.get("x-idempotency-key");
      if (!idempotencyKey) throw new ApiError(400, "VALIDATION_ERROR", "Envie o header Idempotency-Key");
      const body = createOrderSchema.parse(req.body);
      const result = await createPersistedOrder({ customerId: req.session.customerId!, ...body, idempotencyKey });
      const settings = await storage.getSiteSettings();
      const whatsappShareUrl = settings?.whatsappNumber && result.order.publicReference
        ? buildWhatsAppShare(result.order.publicReference, settings.whatsappNumber)
        : null;
      let payment: any = null;
      if (body.paymentMethod !== "whatsapp" && isStripeConfigured()) {
        const session = await createCheckoutSession(result.preview.items as any, {
          name: result.order.customerName,
          phone: result.order.customerPhone,
          email: result.order.customerEmail || undefined,
        }, result.order.id, body.paymentMethod as "card" | "pix");
        if (session) {
          await storage.updateOrderPayment(result.order.id, { stripeSessionId: session.id });
          payment = { checkoutUrl: session.url, sessionId: session.id };
        }
      }
      res.status(result.replayed ? 200 : 201).json({
        order: { ...result.order, total: result.preview.total, items: result.preview.items },
        publicReference: result.order.publicReference,
        whatsappShareUrl,
        payment,
        replayed: result.replayed,
      });
    } catch (error) {
      if (zodError(res, error)) return;
      sendApiError(res, error, "Falha ao criar pedido");
    }
  });

  app.get("/api/customer/orders", requireCustomerAuth, async (req, res) => {
    try {
      const filters = orderSearchSchema.parse(req.query);
      res.json(await listCustomerOrders(req.session.customerId!, filters));
    } catch (error) {
      if (zodError(res, error)) return;
      sendApiError(res, error, "Falha ao buscar histórico");
    }
  });

  app.get("/api/customer/orders/:reference", requireCustomerAuth, async (req, res) => {
    try {
      const order = await findOrderByPublicOrLegacyId(String(req.params.reference));
      if (!order || order.customerId !== req.session.customerId) throw new ApiError(404, "NOT_FOUND", "Pedido não encontrado");
      const [items, events] = await Promise.all([storage.getOrderItems(order.id), storage.getOrderEvents(order.id)]);
      res.json({ ...projectOrder(order), items, events });
    }
    catch (error) { sendApiError(res, error, "Falha ao buscar pedido"); }
  });

  app.get("/api/customer/orders/:reference/payment-status", requireCustomerAuth, async (req, res) => {
    try {
      const order = await findOrderByPublicOrLegacyId(String(req.params.reference));
      if (!order || order.customerId !== req.session.customerId) throw new ApiError(404, "NOT_FOUND", "Pedido não encontrado");
      const result = await getOrderPaymentStatus(order.id);
      res.json(result);
    } catch (error) { sendApiError(res, error, "Falha ao buscar pagamento"); }
  });

  app.get("/api/orders/:reference/payment-status", requireCustomerAuth, async (req, res) => {
    try {
      const order = await findOrderByPublicOrLegacyId(String(req.params.reference));
      if (!order || order.customerId !== req.session.customerId) throw new ApiError(404, "NOT_FOUND", "Pedido não encontrado");
      res.json(await getOrderPaymentStatus(order.id));
    } catch (error) { sendApiError(res, error, "Falha ao buscar pagamento"); }
  });

  // Webhook Stripe: não passa pelo CSRF, pois a assinatura é a autenticação.
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const result = await handleStripeWebhook((req as any).rawBody as Buffer, req.get("stripe-signature") || "");
      if (!result.success) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: result.error } });
      res.json({ received: true });
    } catch (error) { sendApiError(res, error, "Webhook inválido"); }
  });

  // Administração: busca combinada e referência estável, sem documento completo.
  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const filters = orderSearchSchema.parse(req.query);
      res.json(await listAdminOrders({ page: filters.page, pageSize: filters.pageSize, query: filters.q, status: filters.status, from: filters.from ? new Date(filters.from) : undefined, to: filters.to ? new Date(filters.to) : undefined }));
    } catch (error) { if (zodError(res, error)) return; sendApiError(res, error, "Falha ao buscar pedidos"); }
  });

  app.get("/api/orders/:reference", requireAuth, async (req, res) => {
    try {
      const value = String(req.params.reference);
      const order = await findOrderByPublicOrLegacyId(value);
      if (!order) throw new ApiError(404, "NOT_FOUND", "Pedido não encontrado");
      const [items, events, customer] = await Promise.all([
        storage.getOrderItems(order.id),
        storage.getOrderEvents(order.id),
        order.customerId ? storage.getCustomer(order.customerId) : Promise.resolve(undefined),
      ]);
      res.json({ ...order, items, events, customer: customer ? toSafeCustomerProfile(customer) : null });
    }
    catch (error) { sendApiError(res, error, "Falha ao buscar pedido"); }
  });

  app.post("/api/orders/:reference/customer-document/reveal", requireAdmin, async (req, res) => {
    try {
      const body = z.object({ purpose: z.enum(["invoice"]).default("invoice") }).parse(req.body || {});
      const result = await revealCustomerDocumentForOrder(String(req.params.reference), req.session.userId!, body.purpose);
      res.set("Cache-Control", "no-store");
      res.set("Pragma", "no-cache");
      res.json(result);
    } catch (error) {
      if (zodError(res, error)) return;
      sendApiError(res, error, "Falha ao revelar documento fiscal");
    }
  });

  app.patch("/api/orders/:reference/status", requireAuth, async (req, res) => {
    try {
      const body = orderStatusTransitionSchema.parse(req.body);
      const order = await findOrderByPublicOrLegacyId(String(req.params.reference));
      if (!order) throw new ApiError(404, "NOT_FOUND", "Pedido não encontrado");
      const updated = await transitionOrder(order.id, body.status, { type: "admin", id: req.session.userId }, body.reason);
      res.json(updated);
    } catch (error) { if (zodError(res, error)) return; sendApiError(res, error, "Falha ao alterar status"); }
  });
}
