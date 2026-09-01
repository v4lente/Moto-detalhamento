import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { normalizeDocument } from "./customer-identity.service";
import type { CustomerDocumentType } from "@shared/contracts/types";

export class DocumentKeyConfigurationError extends Error {
  code = "DOCUMENT_KEY_NOT_CONFIGURED";
}

export class DocumentDecryptionError extends Error {
  code = "DOCUMENT_DECRYPTION_FAILED";
}

/** Current-release storage policy: normalize, then persist as plain text. */
export function storeDocument(value: string, type: CustomerDocumentType): string {
  return normalizeDocument(value, type);
}

function parseKey(raw: string, source: string): Buffer {
  const normalized = raw.trim();
  const key = /^[a-f0-9]{64}$/i.test(normalized)
    ? Buffer.from(normalized, "hex")
    : Buffer.from(normalized, "base64");
  if (key.length !== 32) throw new DocumentKeyConfigurationError(`${source} deve ter 32 bytes`);
  return key;
}

export function getDocumentKeyVersion(): number {
  const version = Number(process.env.CUSTOMER_DOCUMENT_KEY_VERSION || "1");
  if (!Number.isInteger(version) || version < 1) {
    throw new DocumentKeyConfigurationError("CUSTOMER_DOCUMENT_KEY_VERSION inválida");
  }
  return version;
}

/**
 * Returns all keys available for decryption. CUSTOMER_DOCUMENT_KEY is always
 * the active key; CUSTOMER_DOCUMENT_KEYS may retain previous key versions.
 */
function getKeyRing(): Map<number, Buffer> {
  const keys = new Map<number, Buffer>();
  const configuredRing = process.env.CUSTOMER_DOCUMENT_KEYS?.trim();

  if (configuredRing) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(configuredRing);
    } catch {
      throw new DocumentKeyConfigurationError("CUSTOMER_DOCUMENT_KEYS deve ser um objeto JSON válido");
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new DocumentKeyConfigurationError("CUSTOMER_DOCUMENT_KEYS deve ser um objeto JSON");
    }
    for (const [versionText, raw] of Object.entries(parsed)) {
      const version = Number(versionText);
      if (!Number.isInteger(version) || version < 1 || typeof raw !== "string") {
        throw new DocumentKeyConfigurationError("CUSTOMER_DOCUMENT_KEYS contém uma versão ou chave inválida");
      }
      keys.set(version, parseKey(raw, `CUSTOMER_DOCUMENT_KEYS[${version}]`));
    }
  }

  const currentVersion = getDocumentKeyVersion();
  const currentRaw = process.env.CUSTOMER_DOCUMENT_KEY?.trim();
  if (currentRaw) keys.set(currentVersion, parseKey(currentRaw, "CUSTOMER_DOCUMENT_KEY"));

  if (!keys.has(currentVersion)) {
    throw new DocumentKeyConfigurationError("Nenhuma chave configurada para CUSTOMER_DOCUMENT_KEY_VERSION");
  }
  return keys;
}

function getCurrentKey(): Buffer {
  return getKeyRing().get(getDocumentKeyVersion())!;
}

export function validateDocumentKeyConfig(): void {
  if (process.env.NODE_ENV === "production") {
    // Permite subir em modo degradado (por exemplo, health checks antes da injeção
    // de secrets); o cadastro falhará de forma explícita até a chave ser fornecida.
    if (!process.env.CUSTOMER_DOCUMENT_KEY && !process.env.CUSTOMER_DOCUMENT_KEYS) return;
    getKeyRing();
  }
}

/** Legacy/future protected-storage helper; current profiles use storeDocument. */
export function encryptDocument(value: string, type: CustomerDocumentType): string {
  const key = getCurrentKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(`customer-document:v1:${type}`));
  const ciphertext = Buffer.concat([cipher.update(normalizeDocument(value, type), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [getDocumentKeyVersion(), iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

/** Reads legacy ciphertext rows while protected storage is deferred. */
export function decryptDocument(payload: string, type: CustomerDocumentType): string {
  const [versionEncoded, ivEncoded, tagEncoded, dataEncoded] = payload.split(".");
  const version = Number(versionEncoded);
  if (!Number.isInteger(version) || version < 1 || !ivEncoded || !tagEncoded || !dataEncoded) {
    throw new DocumentDecryptionError("Documento cifrado inválido");
  }

  const key = getKeyRing().get(version);
  if (!key) {
    throw new DocumentKeyConfigurationError(`Chave da versão ${version} não configurada para descriptografar o documento`);
  }

  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivEncoded, "base64url"));
    decipher.setAAD(Buffer.from(`customer-document:v1:${type}`));
    decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(dataEncoded, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    throw new DocumentDecryptionError("Não foi possível descriptografar o documento com a chave configurada");
  }
}

export function hashDocument(value: string, type: CustomerDocumentType): string {
  const pepper = process.env.CUSTOMER_DOCUMENT_HMAC_SECRET || process.env.SESSION_SECRET;
  if (!pepper) throw new DocumentKeyConfigurationError("CUSTOMER_DOCUMENT_HMAC_SECRET não configurada");
  return createHmac("sha256", pepper).update(`${type}:${normalizeDocument(value, type)}`).digest("hex");
}
