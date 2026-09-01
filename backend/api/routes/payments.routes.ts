import type { Express } from "express";
import { requireCustomerAuth } from "../middleware/auth";
import { storage } from "../../infrastructure/storage";
import { getPaymentCapabilities } from "../../services/payment.service";
import { ApiError, sendApiError } from "../lib/api-error";

export function registerPaymentsRoutes(app: Express) {
  app.get("/api/payments/capabilities", async (_req, res) => res.json(await getPaymentCapabilities()));
  app.get("/api/customer/orders/:reference/payment", requireCustomerAuth, async (req, res) => {
    try {
      const order = await storage.getOrderByReference(String(req.params.reference)) || (/^\d+$/.test(String(req.params.reference)) ? await storage.getOrder(Number(req.params.reference)) : undefined);
      if (!order || order.customerId !== req.session.customerId) throw new ApiError(404, "NOT_FOUND", "Pedido não encontrado");
      res.json({ publicReference: order.publicReference, status: order.status, paymentStatus: order.paymentStatus });
    } catch (error) { sendApiError(res, error, "Falha ao buscar pagamento"); }
  });
}
