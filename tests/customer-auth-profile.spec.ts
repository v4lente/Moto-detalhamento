import { test, expect } from "@playwright/test";
import { customerProfileUpdateSchema } from "../shared/contracts/validation";
test("perfil aceita atualização atômica do endereço", () => { const result = customerProfileUpdateSchema.safeParse({ name: "Novo Nome", address: { street: "Rua", number: "1", neighborhood: "Centro", city: "São Paulo", state: "SP", postalCode: "01000-000" } }); expect(result.success).toBeTruthy(); });
