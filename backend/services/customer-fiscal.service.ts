import { storage } from "../infrastructure/storage";
import { ApiError } from "../api/lib/api-error";
import {
  decryptDocument,
  DocumentDecryptionError,
  DocumentKeyConfigurationError,
} from "./customer-document.service";
import { normalizeDocument, toSafeCustomerProfile } from "./customer-identity.service";
import type { CustomerDocumentType } from "@shared/contracts/types";

function isDocumentType(value: string | null): value is CustomerDocumentType {
  return value === "cpf" || value === "cnpj";
}

async function findOrder(reference: string) {
  const byPublicReference = await storage.getOrderByReference(reference);
  if (byPublicReference) return byPublicReference;
  if (/^\d+$/.test(reference)) return storage.getOrder(Number(reference));
  return undefined;
}

export async function revealCustomerDocumentForOrder(reference: string, userId: string, purpose: "invoice" = "invoice") {
  const order = await findOrder(reference);
  if (!order || !order.customerId) throw new ApiError(404, "NOT_FOUND", "Pedido sem cliente vinculado");
  const customer = await storage.getCustomer(order.customerId);
  if (!customer || !isDocumentType(customer.documentType) || (!customer.documentPlaintext && !customer.documentCiphertext)) {
    throw new ApiError(409, "DOCUMENT_UNAVAILABLE", "Cliente sem documento fiscal cadastrado");
  }

  let document: string;
  if (customer.documentPlaintext) {
    document = normalizeDocument(customer.documentPlaintext, customer.documentType);
  } else {
    try {
      document = decryptDocument(customer.documentCiphertext!, customer.documentType);
    } catch (error) {
      if (error instanceof DocumentKeyConfigurationError || error instanceof DocumentDecryptionError) {
        throw new ApiError(
          409,
          "DOCUMENT_UNAVAILABLE",
          "Documento fiscal indisponível para a chave configurada",
        );
      }
      throw error;
    }
  }
  await storage.createSensitiveDataAccessEvent({
    userId,
    customerId: customer.id,
    orderId: order.id,
    action: "customer_document_reveal",
    purpose,
  });

  return {
    customer: toSafeCustomerProfile(customer),
    documentType: customer.documentType,
    document,
  };
}
