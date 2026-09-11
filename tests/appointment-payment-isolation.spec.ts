import { expect, test } from "@playwright/test";
import fs from "node:fs";

const implementationFiles = [
  "migrations/0008_appointment_payment_status.sql",
  "backend/services/appointment.service.ts",
  "backend/api/routes/appointments.routes.ts",
  "frontend/features/admin/pages/appointments-management.tsx",
];

test("pagamento informativo permanece isolado de pedidos e cobranças", () => {
  const implementation = implementationFiles
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");
  const schema = fs.readFileSync("shared/schema.ts", "utf8");
  const appointmentsSchema = schema.slice(
    schema.indexOf("export const appointments ="),
    schema.indexOf("export const appointmentItems ="),
  );

  expect(implementation).not.toMatch(/orders|stripe|webhook|paymentIntent|payment_intent/i);
  expect(appointmentsSchema).not.toMatch(/orders|stripe|webhook|paymentIntent|payment_intent/i);
  expect(implementation).not.toMatch(/FOREIGN KEY|TRIGGER/i);
});
