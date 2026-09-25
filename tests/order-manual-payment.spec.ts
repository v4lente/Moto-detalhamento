import { expect, test } from "@playwright/test";
import { manualOrderPaymentSchema } from "../shared/contracts/validation";
import { changeManualOrderPayment } from "../backend/services/order-payment.service";
import { storage } from "../backend/infrastructure/storage";
import fs from "node:fs";

test("pagamento WhatsApp não altera o status operacional", async () => {
  const original = { getOrderByReference: storage.getOrderByReference, getOrderPaymentEvents: storage.getOrderPaymentEvents, applyOrderPaymentChange: storage.applyOrderPaymentChange };
  const order: any = { id: 7, publicReference: "DV-TESTE", status: "shipped", paymentMethod: "whatsapp", paymentStatus: "pending", paidAt: null };
  try {
    storage.getOrderByReference = async () => order;
    storage.getOrderPaymentEvents = async () => [];
    storage.applyOrderPaymentChange = async (input: any) => ({ order: { ...order, paymentStatus: input.toPaymentStatus, paidAt: input.paidAt }, event: { id: 1, orderId: 7, fromPaymentStatus: "pending", toPaymentStatus: "paid", actorType: "admin", actorId: "u1", source: "manual_whatsapp", reason: null, requestKey: input.requestKey, createdAt: new Date() }, replayed: false });
    const result = await changeManualOrderPayment({ reference: "DV-TESTE", action: "mark_paid", requestKey: "1234567890abcdef", actorId: "u1" });
    expect(result.status).toBe("shipped");
    expect(result.paymentStatus).toBe("paid");
  } finally { Object.assign(storage, original); }
});

test("reversão manual exige motivo", () => {
  expect(manualOrderPaymentSchema.safeParse({ action: "revert_to_pending" }).success).toBeFalsy();
  expect(manualOrderPaymentSchema.safeParse({ action: "revert_to_pending", reason: "Correção operacional" }).success).toBeTruthy();
});

test("chave repetida devolve replay e chave conflitante é rejeitada", async () => {
  const original = { getOrderByReference: storage.getOrderByReference, getOrderPaymentEvents: storage.getOrderPaymentEvents };
  const createdAt = new Date("2026-09-25T12:00:00Z");
  const order: any = { id: 8, publicReference: "DV-REPLAY", status: "confirmed", paymentMethod: "whatsapp", paymentStatus: "paid", paidAt: createdAt };
  try {
    storage.getOrderByReference = async () => order;
    storage.getOrderPaymentEvents = async () => [{ id: 2, orderId: 8, fromPaymentStatus: "pending", toPaymentStatus: "paid", actorType: "admin", actorId: "u1", source: "manual_whatsapp", reason: null, requestKey: "1234567890abcdef", createdAt }];
    const replay = await changeManualOrderPayment({ reference: "DV-REPLAY", action: "mark_paid", requestKey: "1234567890abcdef", actorId: "u1" });
    expect(replay.replayed).toBeTruthy();
    expect(replay.paidAt).toEqual(createdAt);
    await expect(changeManualOrderPayment({ reference: "DV-REPLAY", action: "revert_to_pending", reason: "Correção", requestKey: "1234567890abcdef", actorId: "u1" })).rejects.toMatchObject({ status: 409, code: "IDEMPOTENCY_CONFLICT" });
  } finally { Object.assign(storage, original); }
});

test("storage serializa ações concorrentes antes de conferir o estado", () => {
  const source = fs.readFileSync("backend/infrastructure/storage.ts", "utf8");
  const operation = source.slice(source.indexOf("async applyOrderPaymentChange"), source.indexOf("async applyStripeOrderOutcome"));
  expect(operation).toContain("FOR UPDATE");
  expect(operation).toContain("PAYMENT_STATUS_CONFLICT");
  expect(operation).toContain("eq(orderPaymentEvents.requestKey, input.requestKey)");
});
