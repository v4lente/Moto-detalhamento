import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  publishAdminNotification,
  subscribeAdminNotifications,
} from "../backend/services/admin-notification.service";

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

test.describe("notificações administrativas de pedidos", () => {
  test("publica eventos em tempo real e permite cancelar a assinatura", () => {
    const received: unknown[] = [];
    const unsubscribe = subscribeAdminNotifications((notification) => {
      received.push(notification);
    });

    const payload = { id: 101, type: "new_order", orderId: 55 };
    publishAdminNotification(payload as any);
    expect(received).toEqual([payload]);

    unsubscribe();
    publishAdminNotification({ id: 102 } as any);
    expect(received).toHaveLength(1);
  });

  test("mantém o contrato de SSE, leitura e criação de notificação", () => {
    const routes = read("backend/api/routes/notifications.routes.ts");
    const checkout = read("backend/services/checkout.service.ts");
    const migration = read("migrations/0007_admin_notifications.sql");

    expect(routes).toContain("/stream");
    expect(routes).toContain("text/event-stream");
    expect(routes).toContain("/read-all");
    expect(checkout).toContain("createAdminOrderNotification");
    expect(checkout).toContain("publishAdminNotification");
    expect(migration).toContain("admin_notifications");
    expect(migration).toContain("admin_notification_reads");
    expect(migration).toContain("order_id");
  });
});
