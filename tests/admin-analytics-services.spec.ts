import { expect, test } from "@playwright/test";
import { aggregateDashboardAnalytics, resolveAnalyticsPeriod } from "../backend/services/analytics.service";

test("usa conclusão para realizados e startAt para ocupação", () => {
  const base: any = { status: "concluido", completedAt: new Date("2026-09-10T15:00:00Z"), startAt: new Date("2026-09-09T12:00:00Z") };
  const rows: any = {
    productRows: { orders: [], items: [], paymentEventOrderIds: new Set<number>() },
    serviceRows: {
      completedAppointments: [{ ...base, id: 1, paymentStatus: "pago", totalAmount: "250.50" }, { ...base, id: 2, paymentStatus: "nao_pago", totalAmount: null }, { ...base, id: 4, paymentStatus: "pago", totalAmount: null }],
      demandAppointments: [{ ...base, id: 1 }, { ...base, id: 3, status: "cancelado" }],
      items: [{ appointmentId: 1, serviceId: 3, serviceName: "Polimento" }, { appointmentId: 2, serviceId: 3, serviceName: "Polimento" }],
    },
  };
  const result = aggregateDashboardAnalytics(resolveAnalyticsPeriod({ from: "2026-09-01", to: "2026-09-30" }), rows);
  expect(result.services.completedPaid).toBe(2);
  expect(result.services.completedUnpaid).toBe(1);
  expect(result.services.paidCompletedValueCents).toBe(25050);
  expect(result.services.missingValueCount).toBe(1);
  expect(result.services.weekdayHours.reduce((sum, item) => sum + item.appointments, 0)).toBe(1);
});
