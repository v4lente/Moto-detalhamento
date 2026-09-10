import { expect, test } from "@playwright/test";
import fs from "node:fs";

test.describe("Agendamento restrito ao administrativo", () => {
  test("a home nao oferece acesso ao agendamento publico", () => {
    const homeSource = fs.readFileSync(
      "frontend/features/home/pages/home.tsx",
      "utf8",
    );

    expect(homeSource).not.toContain('href="/agendar"');
    expect(homeSource).not.toContain('data-testid="button-agendar"');
  });

  test("a aplicacao nao registra mais a rota publica de agendamento", () => {
    const appSource = fs.readFileSync("frontend/app/App.tsx", "utf8");

    expect(appSource).not.toContain('path="/agendar"');
    expect(appSource).not.toContain("features/scheduling/pages/agendar");
  });

  test("a aba administrativa de agenda permanece disponivel", () => {
    const navbarSource = fs.readFileSync(
      "frontend/features/admin/components/admin-navbar.tsx",
      "utf8",
    );

    expect(navbarSource).toContain('value: "appointments"');
    expect(navbarSource).toContain('label: "Agenda"');
  });

  test("a criacao de agendamentos exige autenticacao administrativa", () => {
    const routesSource = fs.readFileSync(
      "backend/api/routes/appointments.routes.ts",
      "utf8",
    );

    expect(routesSource).toContain(
      'app.post("/api/appointments", requireAdmin, async (req, res) =>',
    );
  });
});
