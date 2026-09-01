import { test, expect } from "@playwright/test";
import { buildWhatsAppShare } from "../backend/services/checkout.service";
test("WhatsApp é compartilhamento posterior com referência", () => { const url = buildWhatsAppShare("DV-ABC123", "55 (11) 98888-7777"); expect(url).toContain("DV-ABC123"); expect(url).toContain("5511988887777"); });
