import { createHash } from "node:crypto";
import { customerAddressSchema } from "@shared/contracts/validation";
import type { CustomerAddress, CustomerDocumentType } from "@shared/contracts/types";

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeDocument(value: string, type: CustomerDocumentType): string {
  const normalized = type === "cnpj"
    ? value.toUpperCase().replace(/[^0-9A-Z]/g, "")
    : value.replace(/\D/g, "");
  return normalized;
}

export function maskDocument(value: string, type: CustomerDocumentType): string {
  const normalized = normalizeDocument(value, type);
  if (type === "cpf") {
    return normalized.length === 11
      ? `***.${normalized.slice(3, 6)}.${normalized.slice(6, 9)}-**`
      : "***.***.***/****-**";
  }
  return normalized.length === 14
    ? `${normalized.slice(0, 2)}.***.***/****-**`
    : "**.***.***/****-**";
}

export function documentHash(value: string, type: CustomerDocumentType): string {
  return createHash("sha256").update(`${type}:${normalizeDocument(value, type)}`).digest("hex");
}

export function normalizeAddress(address: CustomerAddress): CustomerAddress {
  const parsed = customerAddressSchema.parse(address);
  return {
    ...parsed,
    state: parsed.state.toUpperCase(),
    postalCode: parsed.postalCode.replace(/\D/g, ""),
    complement: parsed.complement?.trim() || null,
  };
}

export function isProfileComplete(customer: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  documentType?: string | null;
  documentHash?: string | null;
  addressStreet?: string | null;
  addressNumber?: string | null;
  addressNeighborhood?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressPostalCode?: string | null;
}): boolean {
  return Boolean(
    customer.name?.trim() && customer.email?.trim() && normalizePhone(customer.phone || "").length >= 10 &&
    (customer.documentType === "cpf" || customer.documentType === "cnpj") && customer.documentHash &&
    customer.addressStreet?.trim() && customer.addressNumber?.trim() && customer.addressNeighborhood?.trim() &&
    customer.addressCity?.trim() && customer.addressState?.trim() && customer.addressPostalCode?.trim(),
  );
}

export function customerAddressFromRow(customer: any): CustomerAddress | null {
  if (!customer?.addressStreet || !customer?.addressNumber || !customer?.addressNeighborhood ||
      !customer?.addressCity || !customer?.addressState || !customer?.addressPostalCode) return null;
  return {
    street: customer.addressStreet,
    number: customer.addressNumber,
    complement: customer.addressComplement || null,
    neighborhood: customer.addressNeighborhood,
    city: customer.addressCity,
    state: customer.addressState,
    postalCode: customer.addressPostalCode,
  };
}

export function toSafeCustomerProfile(customer: any) {
  const address = customerAddressFromRow(customer);
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    documentType: customer.documentType || null,
    documentMasked: customer.documentMasked || null,
    address,
    deliveryAddress: address ? `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ""}, ${address.neighborhood}, ${address.city}/${address.state}, CEP ${address.postalCode}` : customer.deliveryAddress || null,
    profileComplete: Boolean(customer.profileComplete ?? isProfileComplete(customer)),
  };
}
