import { expect, test } from "@playwright/test";
import fs from "node:fs";
import { dashboardAnalyticsQuerySchema } from "../shared/contracts/validation";
import { aggregateDashboardAnalytics, resolveAnalyticsPeriod } from "../backend/services/analytics.service";

test("analytics exige admin e não projeta PII", async ({ request }) => {
  const route = fs.readFileSync("backend/api/routes/analytics.routes.ts", "utf8");
  const response = await request.get("/api/admin/analytics");
  expect(response.status()).toBe(401);
  expect(route).toContain('app.get("/api/admin/analytics", requireAdmin');
  expect(route).not.toMatch(/customerName|customerPhone|customerEmail|document/);
});

test("valida datas e limita o período", () => {
  expect(dashboardAnalyticsQuerySchema.safeParse({ from: "2026-09-01", to: "2026-09-30" }).success).toBeTruthy();
  expect(dashboardAnalyticsQuerySchema.safeParse({ from: "09/01/2026" }).success).toBeFalsy();
  expect(() => resolveAnalyticsPeriod({ from: "2026-10-01", to: "2026-09-01" })).toThrow();
  expect(() => resolveAnalyticsPeriod({ from: "2025-01-01", to: "2026-09-01" })).toThrow();
});

test("período vazio devolve zeros e arrays vazios", () => {
  const result = aggregateDashboardAnalytics(resolveAnalyticsPeriod({ from: "2026-09-01", to: "2026-09-01" }), {
    productRows: { orders: [], items: [], paymentEventOrderIds: new Set() },
    serviceRows: { completedAppointments: [], demandAppointments: [], items: [] },
  });
  expect(result.products.soldOrders).toBe(0);
  expect(result.products.topProducts).toEqual([]);
  expect(result.services.completedPaid).toBe(0);
  expect(result.services.topServices).toEqual([]);
});
