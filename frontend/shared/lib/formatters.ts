export function formatCurrencyBRL(value: number | string | null | undefined): string {
  const amount = typeof value === "number" ? value : Number(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function normalizePhone(value: string | null | undefined): string {
  return String(value || "").replace(/\D/g, "");
}

export function formatPhoneBR(value: string | null | undefined): string {
  const digits = normalizePhone(value);
  if (!digits || digits.length > 11) return digits;
  if (digits.length <= 2) return `(${digits}`;
  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);
  if (number.length <= 4) return `(${ddd}) ${number}`;
  const split = number.length === 9
    ? [number.slice(0, 5), number.slice(5)]
    : [number.slice(0, 4), number.slice(4)];
  return `(${ddd}) ${split[0]}-${split[1]}`;
}

export function formatDocumentInput(value: string | null | undefined, type: "cpf" | "cnpj"): string {
  const normalized = String(value || "").toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 14);
  if (type === "cpf") {
    return normalized.replace(/\D/g, "").slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return /^\d{14}$/.test(normalized)
    ? normalized.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    : normalized;
}
