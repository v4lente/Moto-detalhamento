import type { DashboardAnalytics } from "@shared/contracts";
import { ApiError } from "../api/lib/api-error";
import { loadProductAnalyticsRows, loadServiceAnalyticsRows } from "../infrastructure/analytics.repository";
import { decimalToCents, enumerateDates, nextCivilDate, TIME_ZONE, zonedDayStart, zonedParts } from "./analytics-time-money";

export interface AnalyticsRows {
  productRows: Awaited<ReturnType<typeof loadProductAnalyticsRows>>;
  serviceRows: Awaited<ReturnType<typeof loadServiceAnalyticsRows>>;
}

export function resolveAnalyticsPeriod(input: { from?: string; to?: string }, now = new Date()) {
  const today = zonedParts(now).date;
  const defaultFrom = new Date(`${today}T12:00:00Z`);
  defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 29);
  const from = input.from || defaultFrom.toISOString().slice(0, 10);
  const to = input.to || today;
  if (from > to) throw new ApiError(400, "VALIDATION_ERROR", "A data inicial deve ser anterior à data final");
  const days = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;
  if (days > 366) throw new ApiError(400, "VALIDATION_ERROR", "O período máximo é de 366 dias");
  return { from, to, fromInstant: zonedDayStart(from), toExclusive: zonedDayStart(nextCivilDate(to)) };
}

export function aggregateDashboardAnalytics(period: ReturnType<typeof resolveAnalyticsPeriod>, rows: AnalyticsRows): DashboardAnalytics {
  const dates = enumerateDates(period.from, period.to);
  const productSeries = new Map(dates.map((date) => [date, { date, orders: 0, units: 0, soldValueCents: 0 }]));
  const serviceSeries = new Map(dates.map((date) => [date, { date, completedPaid: 0, valueCents: 0 }]));
  const productHour = new Map<string, { weekday: number; hour: number; orders: number }>();
  const serviceHour = new Map<string, { weekday: number; hour: number; appointments: number }>();
  const productRanking = new Map<string, DashboardAnalytics["products"]["topProducts"][number]>();
  const serviceRanking = new Map<string, DashboardAnalytics["services"]["topServices"][number]>();
  const itemsByOrder = new Map<number, typeof rows.productRows.items>();
  for (const item of rows.productRows.items) itemsByOrder.set(item.orderId, [...(itemsByOrder.get(item.orderId) || []), item]);

  let explicitlyPaidOrders = 0;
  let inferredLegacyOrders = 0;
  let paidCancelledOrders = 0;
  let confirmedPaidOrderValueCents = 0;
  let inferredLegacyValueCents = 0;
  let unitsSold = 0;
  let soldOrderValueCents = 0;
  let soldOrders = 0;

  for (const order of rows.productRows.orders) {
    const valueCents = decimalToCents(order.totalDecimal ?? order.total);
    const explicitPaid = order.paymentStatus === "paid";
    const excluded = ["cancelled", "payment_failed", "refunded"].includes(order.status);
    const inferred = order.paymentTrackingMode === "legacy"
      && order.paymentMethod === "whatsapp"
      && ["shipped", "delivered"].includes(order.status)
      && (order.paymentStatus || "pending") === "pending"
      && !rows.productRows.paymentEventOrderIds.has(order.id);
    if (explicitPaid) {
      explicitlyPaidOrders += 1;
      confirmedPaidOrderValueCents += valueCents;
      if (order.status === "cancelled") paidCancelledOrders += 1;
    }
    if (!((explicitPaid && !excluded) || inferred)) continue;
    soldOrders += 1;
    soldOrderValueCents += valueCents;
    if (inferred) {
      inferredLegacyOrders += 1;
      inferredLegacyValueCents += valueCents;
    }
    const local = zonedParts(order.createdAt);
    const series = productSeries.get(local.date);
    if (series) {
      series.orders += 1;
      series.soldValueCents += valueCents;
    }
    const hourKey = `${local.weekday}:${local.hour}`;
    const hour = productHour.get(hourKey) || { weekday: local.weekday, hour: local.hour, orders: 0 };
    hour.orders += 1;
    productHour.set(hourKey, hour);
    for (const item of itemsByOrder.get(order.id) || []) {
      unitsSold += item.quantity;
      if (series) series.units += item.quantity;
      const key = `${item.productId ?? "removed"}:${item.variationId ?? "base"}:${item.productName}:${item.variationLabel || ""}`;
      const rank = productRanking.get(key) || { productId: item.productId, productName: item.productName, variationId: item.variationId, variationLabel: item.variationLabel, units: 0, valueCents: 0 };
      rank.units += item.quantity;
      rank.valueCents += decimalToCents(item.unitPriceDecimal ?? item.productPrice) * item.quantity;
      productRanking.set(key, rank);
    }
  }

  let completedPaid = 0;
  let completedUnpaid = 0;
  let paidCompletedValueCents = 0;
  let unpaidCompletedValueCents = 0;
  let missingValueCount = 0;
  const completedIds = new Set<number>();
  for (const appointment of rows.serviceRows.completedAppointments) {
    if (appointment.status !== "concluido" || !appointment.completedAt) continue;
    completedIds.add(appointment.id);
    const knownValue = appointment.totalAmount !== null;
    const valueCents = decimalToCents(appointment.totalAmount);
    if (appointment.paymentStatus === "pago") {
      completedPaid += 1;
      paidCompletedValueCents += valueCents;
      if (!knownValue) missingValueCount += 1;
      const local = zonedParts(appointment.completedAt);
      const series = serviceSeries.get(local.date);
      if (series) {
        series.completedPaid += 1;
        series.valueCents += valueCents;
      }
    } else {
      completedUnpaid += 1;
      unpaidCompletedValueCents += valueCents;
    }
  }
  for (const item of rows.serviceRows.items) {
    if (!completedIds.has(item.appointmentId)) continue;
    const key = `${item.serviceId ?? "removed"}:${item.serviceName}`;
    const rank = serviceRanking.get(key) || { serviceId: item.serviceId, serviceName: item.serviceName, completedCount: 0 };
    rank.completedCount += 1;
    serviceRanking.set(key, rank);
  }
  for (const appointment of rows.serviceRows.demandAppointments) {
    if (appointment.status === "cancelado") continue;
    const local = zonedParts(appointment.startAt);
    const key = `${local.weekday}:${local.hour}`;
    const hour = serviceHour.get(key) || { weekday: local.weekday, hour: local.hour, appointments: 0 };
    hour.appointments += 1;
    serviceHour.set(key, hour);
  }

  return {
    period: { from: period.from, to: period.to, timeZone: TIME_ZONE, productDateBasis: "order_created_at", serviceDateBasis: "appointment_completed_at", serviceDemandDateBasis: "appointment_start_at" },
    products: {
      soldOrders, explicitlyPaidOrders, inferredLegacyOrders, unitsSold, soldOrderValueCents,
      confirmedPaidOrderValueCents, paidCancelledOrders, inferredLegacyValueCents,
      averageTicketCents: soldOrders ? Math.round(soldOrderValueCents / soldOrders) : 0,
      series: Array.from(productSeries.values()),
      topProducts: Array.from(productRanking.values()).sort((a, b) => b.units - a.units || b.valueCents - a.valueCents).slice(0, 10),
      weekdayHours: Array.from(productHour.values()).sort((a, b) => a.weekday - b.weekday || a.hour - b.hour),
    },
    services: {
      completedPaid, completedUnpaid, paidCompletedValueCents, unpaidCompletedValueCents, missingValueCount,
      series: Array.from(serviceSeries.values()),
      topServices: Array.from(serviceRanking.values()).sort((a, b) => b.completedCount - a.completedCount).slice(0, 10),
      weekdayHours: Array.from(serviceHour.values()).sort((a, b) => a.weekday - b.weekday || a.hour - b.hour),
    },
  };
}

export async function getDashboardAnalytics(input: { from?: string; to?: string }): Promise<DashboardAnalytics> {
  const period = resolveAnalyticsPeriod(input);
  const [productRows, serviceRows] = await Promise.all([
    loadProductAnalyticsRows(period.fromInstant, period.toExclusive),
    loadServiceAnalyticsRows(period.fromInstant, period.toExclusive),
  ]);
  return aggregateDashboardAnalytics(period, { productRows, serviceRows });
}
