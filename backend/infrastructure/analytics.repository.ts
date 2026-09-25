import { and, gte, inArray, lt } from "drizzle-orm";
import { appointments, appointmentItems, orderItems, orderPaymentEvents, orders } from "@shared/schema";
import { db } from "./db";

export async function loadProductAnalyticsRows(from: Date, toExclusive: Date) {
  const orderRows = await db.select().from(orders).where(and(gte(orders.createdAt, from), lt(orders.createdAt, toExclusive)));
  if (!orderRows.length) return { orders: orderRows, items: [], paymentEventOrderIds: new Set<number>() };
  const ids = orderRows.map((order) => order.id);
  const [items, events] = await Promise.all([
    db.select().from(orderItems).where(inArray(orderItems.orderId, ids)),
    db.select({ orderId: orderPaymentEvents.orderId }).from(orderPaymentEvents).where(inArray(orderPaymentEvents.orderId, ids)),
  ]);
  return { orders: orderRows, items, paymentEventOrderIds: new Set(events.map((event) => event.orderId)) };
}

export async function loadServiceAnalyticsRows(from: Date, toExclusive: Date) {
  const [completedAppointments, demandAppointments] = await Promise.all([
    db.select().from(appointments).where(and(gte(appointments.completedAt, from), lt(appointments.completedAt, toExclusive))),
    db.select().from(appointments).where(and(gte(appointments.startAt, from), lt(appointments.startAt, toExclusive))),
  ]);
  const ids = completedAppointments.map((appointment) => appointment.id);
  const items = ids.length ? await db.select().from(appointmentItems).where(inArray(appointmentItems.appointmentId, ids)) : [];
  return { completedAppointments, demandAppointments, items };
}
