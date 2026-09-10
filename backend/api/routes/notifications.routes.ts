import type { Express } from "express";
import { storage } from "../../infrastructure/storage";
import { requireAdmin } from "../middleware/auth";
import { subscribeAdminNotifications } from "../../services/admin-notification.service";
import { sendApiError } from "../lib/api-error";

export function registerNotificationsRoutes(app: Express) {
  app.get("/api/admin/notifications/stream", requireAdmin, (req, res) => {
    res.status(200).set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    res.write(`: connected\n\n`);

    const heartbeat = setInterval(() => {
      if (!res.writableEnded) res.write(`: heartbeat ${Date.now()}\n\n`);
    }, 25_000);
    const unsubscribe = subscribeAdminNotifications((notification) => {
      if (res.writableEnded) return;
      res.write(`event: notification\ndata: ${JSON.stringify(notification)}\n\n`);
    });
    req.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });

  app.get("/api/admin/notifications", requireAdmin, async (req, res) => {
    try {
      const unreadOnly = req.query.unread === "true";
      const notifications = await storage.listAdminNotifications(req.session.userId!, { unreadOnly });
      const unreadCount = await storage.countUnreadAdminNotifications(req.session.userId!);
      res.json({ notifications, unreadCount });
    } catch (error) {
      sendApiError(res, error, "Falha ao buscar notificações");
    }
  });

  app.patch("/api/admin/notifications/:id/read", requireAdmin, async (req, res) => {
    try {
      const notificationId = Number(req.params.id);
      if (!Number.isSafeInteger(notificationId) || notificationId <= 0) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Notificação inválida" } });
      }
      const marked = await storage.markAdminNotificationRead(notificationId, req.session.userId!);
      if (!marked) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Notificação não encontrada" } });
      res.json({ ok: true, unreadCount: await storage.countUnreadAdminNotifications(req.session.userId!) });
    } catch (error) {
      sendApiError(res, error, "Falha ao marcar notificação");
    }
  });

  app.post("/api/admin/notifications/read-all", requireAdmin, async (req, res) => {
    try {
      const marked = await storage.markAllAdminNotificationsRead(req.session.userId!);
      res.json({ ok: true, marked, unreadCount: 0 });
    } catch (error) {
      sendApiError(res, error, "Falha ao marcar notificações");
    }
  });
}
