import { expect, test } from "@playwright/test";

const orders = [
  ...Array.from({ length: 22 }, (_, index) => ({
    id: index + 1,
    publicReference: `DV-${String(index + 1).padStart(3, "0")}`,
    customerName: `Cliente ${index + 1}`,
    customerEmail: `cliente${index + 1}@example.com`,
    createdAt: "2026-09-25T10:00:00.000Z",
    total: 20,
    status: "pending",
    paymentMethod: "whatsapp",
    paymentStatus: "pending",
  })),
  {
    id: 23,
    publicReference: "DV-023",
    customerName: "Cliente Cancelado",
    customerEmail: "cancelado@example.com",
    createdAt: "2026-09-24T10:00:00.000Z",
    total: 30,
    status: "cancelled",
    paymentMethod: "whatsapp",
    paymentStatus: "pending",
  },
];

test("Pedidos inicia em pendentes, pagina na API e reinicia ao filtrar ou buscar", async ({ page }) => {
  const orderQueries: URLSearchParams[] = [];

  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    let result: unknown = null;

    if (url.pathname === "/api/auth/me") {
      result = { id: "admin-1", username: "admin@example.com", role: "admin" };
    } else if (url.pathname === "/api/admin/notifications") {
      result = { notifications: [], unreadCount: 0 };
    } else if (url.pathname === "/api/admin/notifications/stream") {
      await route.fulfill({ status: 204 });
      return;
    } else if (url.pathname === "/api/orders") {
      orderQueries.push(new URLSearchParams(url.search));
      const pageNumber = Number(url.searchParams.get("page") || 1);
      const pageSize = Number(url.searchParams.get("pageSize") || 20);
      const status = url.searchParams.get("status");
      const search = (url.searchParams.get("q") || "").toLowerCase();
      const filtered = orders.filter((order) =>
        (!status || order.status === status) &&
        (!search || `${order.publicReference} ${order.customerName} ${order.customerEmail}`.toLowerCase().includes(search))
      );
      result = {
        items: filtered.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
        total: filtered.length,
        page: pageNumber,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
      };
    }

    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(result) });
  });

  await page.goto("http://127.0.0.1:5000/admin");
  await page.getByTestId("tab-orders").click();

  const cards = page.locator('[data-testid^="admin-order-"]');
  const statusFilter = page.getByTestId("select-order-status-filter");
  await expect(statusFilter).toContainText("Pendente");
  await expect(cards).toHaveCount(10);
  await expect(page.getByText("Página 1 de 3")).toBeVisible();
  expect(orderQueries.some((query) => query.get("page") === "1" && query.get("pageSize") === "10" && query.get("status") === "pending")).toBeTruthy();

  await page.getByTestId("button-admin-orders-next").click();
  await expect(cards).toHaveCount(10);
  await expect(page.getByText("Página 2 de 3")).toBeVisible();
  await page.getByTestId("button-admin-orders-next").click();
  await expect(cards).toHaveCount(2);
  await expect(page.getByText("Página 3 de 3")).toBeVisible();
  expect(orderQueries.some((query) => query.get("page") === "3" && query.get("status") === "pending")).toBeTruthy();

  await statusFilter.click();
  await page.getByRole("option", { name: "Cancelado" }).click();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Cliente Cancelado");
  await expect(page.getByTestId("button-admin-orders-next")).toHaveCount(0);
  expect(orderQueries.some((query) => query.get("page") === "1" && query.get("status") === "cancelled")).toBeTruthy();

  await statusFilter.click();
  await page.getByRole("option", { name: "Todos" }).click();
  await page.getByTestId("input-admin-order-search").fill("Cliente 12");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Cliente 12");
  expect(orderQueries.some((query) => query.get("page") === "1" && query.get("q") === "Cliente 12" && !query.has("status"))).toBeTruthy();
});
