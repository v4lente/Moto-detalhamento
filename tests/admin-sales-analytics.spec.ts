import { expect, test } from "@playwright/test";
import fs from "node:fs";

test("dashboard integra total real, filtros, estados e gráficos acessíveis", () => {
  const dashboard = fs.readFileSync("frontend/features/admin/pages/dashboard.tsx", "utf8");
  const orders = fs.readFileSync("frontend/features/admin/pages/orders-management.tsx", "utf8");
  const sales = fs.readFileSync("frontend/features/admin/components/sales-analytics.tsx", "utf8");
  const services = fs.readFileSync("frontend/features/admin/components/service-analytics.tsx", "utf8");
  expect(dashboard).toContain("ordersPage?.total");
  expect(dashboard).toContain("useDashboardAnalytics");
  expect(dashboard).toContain("analyticsLoading");
  expect(dashboard).toContain("analyticsError");
  expect(orders).toContain("manual-payment-controls");
  expect(orders).toContain("Histórico de pagamento");
  expect(sales).toContain("<caption");
  expect(services).toContain("<caption");
});

test("administrador consulta análises e registra pagamento separado do envio", async ({ page }) => {
  let paid = false;
  const order = { id: 1, publicReference: "DV-001", customerId: null, customerName: "Cliente Teste", customerPhone: "11999999999", customerEmail: null, deliveryAddress: null, createdAt: "2026-09-25T10:00:00.000Z", total: 100, status: "shipped", paymentMethod: "whatsapp", paymentStatus: "pending" };
  const analytics = {
    period: { from: "2026-09-01", to: "2026-09-30", timeZone: "America/Sao_Paulo", productDateBasis: "order_created_at", serviceDateBasis: "appointment_completed_at", serviceDemandDateBasis: "appointment_start_at" },
    products: { soldOrders: 1, explicitlyPaidOrders: 0, inferredLegacyOrders: 1, unitsSold: 2, soldOrderValueCents: 10000, confirmedPaidOrderValueCents: 0, paidCancelledOrders: 0, inferredLegacyValueCents: 10000, averageTicketCents: 10000, series: [{ date: "2026-09-25", orders: 1, units: 2, soldValueCents: 10000 }], topProducts: [{ productId: 1, productName: "Cera", variationId: null, variationLabel: null, units: 2, valueCents: 10000 }], weekdayHours: [{ weekday: 5, hour: 7, orders: 1 }] },
    services: { completedPaid: 1, completedUnpaid: 0, paidCompletedValueCents: 20000, unpaidCompletedValueCents: 0, missingValueCount: 0, series: [{ date: "2026-09-25", completedPaid: 1, valueCents: 20000 }], topServices: [{ serviceId: 2, serviceName: "Polimento", completedCount: 1 }], weekdayHours: [{ weekday: 5, hour: 9, appointments: 1 }] },
  };

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "admin-1", username: "admin", role: "admin" } });
    if (url.pathname === "/api/admin/notifications") return route.fulfill({ json: { notifications: [], unreadCount: 0 } });
    if (url.pathname === "/api/admin/notifications/stream") return route.fulfill({ status: 204 });
    if (url.pathname === "/api/security/csrf") return route.fulfill({ json: { token: "csrf-test" } });
    if (url.pathname === "/api/appointments/summary") return route.fulfill({ json: { today: 0, notStarted: 0, inProgress: 0, upcoming: [] } });
    if (url.pathname === "/api/admin/analytics") return route.fulfill({ json: analytics });
    if (url.pathname === "/api/orders/DV-001/payment" && request.method() === "POST") {
      paid = true;
      return route.fulfill({ json: { reference: "DV-001", status: "shipped", paymentStatus: "paid", paidAt: "2026-09-25T12:00:00.000Z", paymentEvent: { id: 9, orderId: 1, fromPaymentStatus: "pending", toPaymentStatus: "paid", actorType: "admin", actorId: "admin-1", source: "manual_whatsapp", reason: null, createdAt: "2026-09-25T12:00:00.000Z" }, replayed: false } });
    }
    if (url.pathname === "/api/orders/1") return route.fulfill({ json: { ...order, paymentStatus: paid ? "paid" : "pending", paidAt: paid ? "2026-09-25T12:00:00.000Z" : null, items: [{ id: 1, orderId: 1, productId: 1, productName: "Cera", productPrice: 50, quantity: 2 }], events: [{ fromStatus: "confirmed", toStatus: "shipped", actorType: "admin", createdAt: "2026-09-25T11:00:00.000Z" }], paymentEvents: paid ? [{ id: 9, orderId: 1, fromPaymentStatus: "pending", toPaymentStatus: "paid", actorType: "admin", actorId: "admin-1", source: "manual_whatsapp", reason: null, createdAt: "2026-09-25T12:00:00.000Z" }] : [], customer: null } });
    if (url.pathname === "/api/orders") return route.fulfill({ json: { items: [{ ...order, paymentStatus: paid ? "paid" : "pending" }], total: 23, page: 1, pageSize: Number(url.searchParams.get("pageSize") || 5), totalPages: 1 } });
    return route.fulfill({ status: 200, json: null });
  });

  await page.goto("/admin");
  await expect(page.getByText("23 pedidos no total")).toBeVisible();
  await expect(page.getByTestId("sales-analytics")).toContainText("1 venda(s) histórica(s) inferida(s)");
  await expect(page.getByTestId("service-analytics")).toContainText("Polimento");
  await page.getByTestId("tab-orders").click();
  await page.getByTestId("button-view-order-1").click();
  await expect(page.getByText("Movimentação do pedido")).toBeVisible();
  await page.getByTestId("button-mark-order-paid").click();
  await expect(page.getByText("Histórico de pagamento")).toBeVisible();
  await expect(page.getByText(/pending → paid/)).toBeVisible();
  await expect(page.getByText(/confirmed → shipped/)).toBeVisible();
});
