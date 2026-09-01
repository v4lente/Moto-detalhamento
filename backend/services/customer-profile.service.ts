import type { Customer } from "@shared/schema";
import { adminCustomerCreateSchema, adminCustomerUpdateSchema, customerProfileUpdateSchema, customerRegistrationSchema } from "@shared/contracts/validation";
import { storage } from "../infrastructure/storage";
import { hashPassword } from "./auth.service";
import { hashDocument, storeDocument } from "./customer-document.service";
import { isProfileComplete, maskDocument, normalizeAddress, normalizeDocument, normalizeEmail, normalizePhone, toSafeCustomerProfile } from "./customer-identity.service";

export class CustomerIdentityConflictError extends Error {
  code = "CUSTOMER_IDENTITY_CONFLICT";
}

function customerFieldsFromAddress(address: any) {
  const normalized = normalizeAddress(address);
  return {
    addressStreet: normalized.street,
    addressNumber: normalized.number,
    addressComplement: normalized.complement || null,
    addressNeighborhood: normalized.neighborhood,
    addressCity: normalized.city,
    addressState: normalized.state,
    addressPostalCode: normalized.postalCode,
  };
}

export async function registerCustomer(input: unknown): Promise<Customer> {
  const data = customerRegistrationSchema.parse(input);
  const email = normalizeEmail(data.email);
  const phone = normalizePhone(data.phone);
  const normalizedDocument = data.documentType === "cpf"
    ? data.document.replace(/\D/g, "")
    : data.document.toUpperCase().replace(/[^0-9A-Z]/g, "");
  const hash = hashDocument(normalizedDocument, data.documentType);
  const [byEmail, byPhone, byDocument] = await Promise.all([
    storage.getCustomerByEmail(email),
    storage.getCustomerByPhone(phone),
    storage.getCustomerByDocumentHash(hash),
  ]);
  const conflicts = [byEmail, byPhone, byDocument].filter(Boolean) as Customer[];
  if (conflicts.some((customer) => customer.isRegistered)) throw new CustomerIdentityConflictError("Email, telefone ou documento já cadastrado");
  const existing = conflicts[0];
  const fields: any = {
    name: data.name.trim(),
    email,
    phone,
    password: await hashPassword(data.password),
    isRegistered: true,
    documentType: data.documentType,
    documentPlaintext: storeDocument(normalizedDocument, data.documentType),
    documentCiphertext: null,
    documentHash: hash,
    documentMasked: maskDocument(normalizedDocument, data.documentType),
    documentKeyVersion: null,
    ...customerFieldsFromAddress(data.address),
    profileComplete: true,
  };
  if (existing) {
    return (await storage.updateCustomer(existing.id, fields)) as Customer;
  }
  return storage.createCustomer(fields);
}

export async function createAdminCustomer(input: unknown): Promise<Customer> {
  const data = adminCustomerCreateSchema.parse(input);
  const email = normalizeEmail(data.email);
  const phone = normalizePhone(data.phone);
  const normalizedDocument = normalizeDocument(data.document, data.documentType);
  const hash = hashDocument(normalizedDocument, data.documentType);
  const [byEmail, byPhone, byDocument] = await Promise.all([
    storage.getCustomerByEmail(email),
    storage.getCustomerByPhone(phone),
    storage.getCustomerByDocumentHash(hash),
  ]);
  if (byEmail || byPhone || byDocument) {
    throw new CustomerIdentityConflictError("Email, telefone ou documento já cadastrado");
  }

  return storage.createCustomer({
    name: data.name.trim(),
    email,
    phone,
    nickname: data.nickname?.trim() || null,
    password: await hashPassword(data.password),
    isRegistered: true,
    documentType: data.documentType,
    documentPlaintext: storeDocument(normalizedDocument, data.documentType),
    documentCiphertext: null,
    documentHash: hash,
    documentMasked: maskDocument(normalizedDocument, data.documentType),
    documentKeyVersion: null,
    ...customerFieldsFromAddress(data.address),
    profileComplete: true,
  });
}

export async function updateAdminCustomer(customerId: string, input: unknown): Promise<Customer> {
  const data = adminCustomerUpdateSchema.parse(input);
  const current = await storage.getCustomer(customerId);
  if (!current) throw new Error("CUSTOMER_NOT_FOUND");

  const fields: any = {};
  if (data.name !== undefined) fields.name = data.name.trim();
  if (data.email !== undefined) {
    const email = data.email ? normalizeEmail(data.email) : null;
    if (email && email !== current.email) {
      const existing = await storage.getCustomerByEmail(email);
      if (existing && existing.id !== customerId) throw new CustomerIdentityConflictError("Email já cadastrado por outro cliente");
    }
    fields.email = email;
  }
  if (data.phone !== undefined) {
    const phone = normalizePhone(data.phone);
    if (phone !== current.phone) {
      const existing = await storage.getCustomerByPhone(phone);
      if (existing && existing.id !== customerId) throw new CustomerIdentityConflictError("Telefone já cadastrado por outro cliente");
    }
    fields.phone = phone;
  }
  if (data.nickname !== undefined) fields.nickname = data.nickname;
  if (data.deliveryAddress !== undefined) fields.deliveryAddress = data.deliveryAddress || null;
  if (data.address) Object.assign(fields, customerFieldsFromAddress(data.address));
  if (data.document && data.documentType) {
    const normalizedDocument = normalizeDocument(data.document, data.documentType);
    const hash = hashDocument(normalizedDocument, data.documentType);
    const existing = await storage.getCustomerByDocumentHash(hash);
    if (existing && existing.id !== customerId) throw new CustomerIdentityConflictError("Documento já cadastrado por outro cliente");
    Object.assign(fields, {
      documentType: data.documentType,
      documentPlaintext: storeDocument(normalizedDocument, data.documentType),
      documentCiphertext: null,
      documentHash: hash,
      documentMasked: maskDocument(normalizedDocument, data.documentType),
      documentKeyVersion: null,
    });
  }
  fields.profileComplete = isProfileComplete({ ...current, ...fields });
  return (await storage.updateCustomer(customerId, fields)) as Customer;
}

export async function updateCustomerProfile(customerId: string, input: unknown): Promise<Customer> {
  const data = customerProfileUpdateSchema.parse(input);
  const current = await storage.getCustomer(customerId);
  if (!current) throw new Error("CUSTOMER_NOT_FOUND");
  const fields: any = {};
  if (data.name !== undefined) fields.name = data.name.trim();
  if (data.phone !== undefined) {
    const phone = normalizePhone(data.phone);
    const existingPhone = await storage.getCustomerByPhone(phone);
    if (existingPhone && existingPhone.id !== customerId) throw new CustomerIdentityConflictError("Telefone já cadastrado");
    fields.phone = phone;
  }
  if (data.document && data.documentType) {
    const normalizedDocument = data.documentType === "cpf"
      ? data.document.replace(/\D/g, "")
      : data.document.toUpperCase().replace(/[^0-9A-Z]/g, "");
    const hash = hashDocument(normalizedDocument, data.documentType);
    const existingDocument = await storage.getCustomerByDocumentHash(hash);
    if (existingDocument && existingDocument.id !== customerId) throw new CustomerIdentityConflictError("Documento já cadastrado");
    Object.assign(fields, {
      documentType: data.documentType,
      documentPlaintext: storeDocument(normalizedDocument, data.documentType),
      documentCiphertext: null,
      documentHash: hash,
      documentMasked: maskDocument(normalizedDocument, data.documentType),
      documentKeyVersion: null,
    });
  }
  if (data.address) Object.assign(fields, customerFieldsFromAddress(data.address));
  const merged = { ...current, ...fields };
  fields.profileComplete = isProfileComplete(merged);
  return (await storage.updateCustomer(customerId, fields)) as Customer;
}

export function safeProfile(customer: Customer) {
  return toSafeCustomerProfile(customer);
}
