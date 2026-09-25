import { expect, test } from "@playwright/test";
import { aggregateDashboardAnalytics, resolveAnalyticsPeriod } from "../backend/services/analytics.service";

test("separa venda explícita, inferência legada e cancelamento", () => {
  const createdAt = new Date("2026-09-10T15:00:00Z");
  const order = (value: any) => ({ id: value.id, createdAt, total: value.total || 100, totalDecimal: value.totalDecimal || "100.00", paymentMethod: "whatsapp", paymentStatus: "pending", paymentTrackingMode: "explicit", status: "confirmed", ...value });
  const rows: any = {
    productRows: {
      orders: [order({ id: 1, paymentStatus: "paid" }), order({ id: 2, paymentTrackingMode: "legacy", status: "shipped" }), order({ id: 3, paymentStatus: "paid", status: "cancelled" }), order({ id: 4, paymentTrackingMode: "legacy", status: "delivered" })],
      items: [{ orderId: 1, productId: 8, productName: "Cera", variationId: 2, variationLabel: "500 ml", quantity: 2, unitPriceDecimal: "20.00", productPrice: 20 }],
      paymentEventOrderIds: new Set<number>([4]),
    },
    serviceRows: { completedAppointments: [], demandAppointments: [], items: [] },
  };
  const result = aggregateDashboardAnalytics(resolveAnalyticsPeriod({ from: "2026-09-01", to: "2026-09-30" }), rows);
  expect(result.products.soldOrders).toBe(2);
  expect(result.products.explicitlyPaidOrders).toBe(2);
  expect(result.products.inferredLegacyOrders).toBe(1);
  expect(result.products.paidCancelledOrders).toBe(1);
  expect(result.products.unitsSold).toBe(2);
  expect(result.products.topProducts[0]).toMatchObject({ variationId: 2, variationLabel: "500 ml", valueCents: 4000 });
});
