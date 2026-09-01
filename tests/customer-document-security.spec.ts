import { test, expect } from "@playwright/test";
import { encryptDocument, decryptDocument, hashDocument } from "../backend/services/customer-document.service";
test.beforeEach(() => { process.env.CUSTOMER_DOCUMENT_KEY = Buffer.alloc(32, 7).toString("base64"); process.env.CUSTOMER_DOCUMENT_HMAC_SECRET = "test-pepper"; });
test("cifra/decifra e hash contextual", () => { const encrypted = encryptDocument("529.982.247-25", "cpf"); expect(decryptDocument(encrypted, "cpf")).toBe("52998224725"); expect(hashDocument("52998224725", "cpf")).toHaveLength(64); });
test("tag adulterada falha", () => { const encrypted = encryptDocument("52998224725", "cpf"); const parts = encrypted.split("."); parts[2] = Buffer.alloc(16, 1).toString("base64url"); expect(() => decryptDocument(parts.join("."), "cpf")).toThrow(); });
