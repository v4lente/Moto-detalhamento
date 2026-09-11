import { expect, test } from "@playwright/test";
import fs from "node:fs";

const agendaPath = "frontend/features/admin/pages/appointments-management.tsx";

test("agenda não transforma erro da API em lista vazia", () => {
  const agenda = fs.readFileSync(agendaPath, "utf8");

  expect(agenda).toContain("isError");
  expect(agenda).toContain("Não foi possível carregar os agendamentos.");
  expect(agenda).toContain('data-testid="appointment-list-error"');
});
