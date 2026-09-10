import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ensureAppointmentBudgetsDir } from "../api/lib/private-uploads-dir";
import type { AppointmentWithItems, SiteSettings } from "@shared/schema";

export const BUDGET_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const BUDGET_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const EXTENSIONS: Record<(typeof BUDGET_ALLOWED_MIME_TYPES)[number], string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function validateBudgetFile(buffer: Buffer, mimeType: string): string | null {
  if (!BUDGET_ALLOWED_MIME_TYPES.includes(mimeType as (typeof BUDGET_ALLOWED_MIME_TYPES)[number])) {
    return "Envie um arquivo PDF, JPEG, PNG ou WebP";
  }
  const signatures: Record<string, boolean> = {
    "application/pdf": buffer.subarray(0, 5).toString("ascii") === "%PDF-",
    "image/jpeg": buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
    "image/png": buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    "image/webp": buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP",
  };
  return signatures[mimeType] ? null : "O conteúdo do arquivo não corresponde ao formato informado";
}

export async function storeBudgetFile(buffer: Buffer, mimeType: string): Promise<string> {
  const directory = ensureAppointmentBudgetsDir();
  const extension = EXTENSIONS[mimeType as keyof typeof EXTENSIONS];
  const storageKey = `${randomUUID()}${extension}`;
  await fs.writeFile(path.join(directory, storageKey), buffer, { flag: "wx" });
  return storageKey;
}

export async function readBudgetFile(storageKey: string): Promise<Buffer> {
  return fs.readFile(resolveBudgetPath(storageKey));
}

export async function removeBudgetFile(storageKey: string | null | undefined): Promise<void> {
  if (!storageKey) return;
  try {
    await fs.unlink(resolveBudgetPath(storageKey));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

function resolveBudgetPath(storageKey: string): string {
  if (path.basename(storageKey) !== storageKey) throw new Error("Invalid budget storage key");
  return path.join(ensureAppointmentBudgetsDir(), storageKey);
}

function money(value: string | null): string {
  if (!value) return "A definir";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function dateTime(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function wrapText(value: string, width = 88): string[] {
  const words = value.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    if (!current) current = word;
    else if (`${current} ${word}`.length <= width) current += ` ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function pdfEscape(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "-")
    .replace(/([\\()])/g, "\\$1");
}

function buildPdf(lines: string[]): Buffer {
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += 43) pages.push(lines.slice(index, index + 43));
  const objects: Buffer[] = [Buffer.alloc(0), Buffer.alloc(0), Buffer.alloc(0), Buffer.alloc(0)];
  objects[1] = Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "ascii");
  objects[3] = Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "ascii");
  const pageIds: number[] = [];

  pages.forEach((pageLines) => {
    const contentId = objects.length;
    const content = `BT\n/F1 10 Tf\n50 790 Td\n16 TL\n${pageLines.map((line) => `(${pdfEscape(line)}) Tj\nT*`).join("\n")}\nET`;
    const contentBuffer = Buffer.from(content, "ascii");
    objects.push(Buffer.concat([
      Buffer.from(`<< /Length ${contentBuffer.length} >>\nstream\n`, "ascii"),
      contentBuffer,
      Buffer.from("\nendstream", "ascii"),
    ]));
    const pageId = objects.length;
    pageIds.push(pageId);
    objects.push(Buffer.from(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`,
      "ascii",
    ));
  });
  objects[2] = Buffer.from(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`, "ascii");

  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n%DVMD\n", "ascii")];
  const offsets = [0];
  let offset = chunks[0].length;
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = offset;
    const object = Buffer.concat([
      Buffer.from(`${id} 0 obj\n`, "ascii"),
      objects[id],
      Buffer.from("\nendobj\n", "ascii"),
    ]);
    chunks.push(object);
    offset += object.length;
  }
  const xrefOffset = offset;
  const xref = [
    `xref\n0 ${objects.length}\n`,
    "0000000000 65535 f \n",
    ...offsets.slice(1).map((item) => `${String(item).padStart(10, "0")} 00000 n \n`),
    `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  ].join("");
  chunks.push(Buffer.from(xref, "ascii"));
  return Buffer.concat(chunks);
}

export function generateBudgetPdf(
  appointment: AppointmentWithItems,
  settings: SiteSettings | undefined,
): Buffer {
  if (!appointment.totalAmount) throw new Error("Defina ao menos um valor antes de gerar o orçamento");
  const lines = [
    (settings?.siteName || "Daniel Valente").toUpperCase(),
    settings?.siteTagline || "Moto Detalhamento",
    settings?.businessAddress || "",
    settings?.whatsappNumber ? `WhatsApp: ${settings.whatsappNumber}` : "",
    "",
    `ORCAMENTO ORC-${appointment.id}`,
    `Emitido em: ${dateTime(new Date())}`,
    "",
    `Proprietario: ${appointment.customerName}`,
    `Telefone: ${appointment.customerPhone}`,
    appointment.customerEmail ? `E-mail: ${appointment.customerEmail}` : "",
    `Moto: ${appointment.vehicleInfo}`,
    `Inicio agendado: ${dateTime(appointment.startAt)}`,
    "",
    "SERVICOS",
  ].filter(Boolean);

  appointment.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.serviceName} - ${money(item.agreedAmount)}`);
    wrapText(item.description).forEach((line) => lines.push(`   ${line}`));
    lines.push(`   Duracao estimada: ${item.durationMinutes} minutos`);
  });
  lines.push("", `VALOR COMBINADO: ${money(appointment.totalAmount)}`);
  if (appointment.adminNotes) {
    lines.push("", "OBSERVACOES");
    wrapText(appointment.adminNotes).forEach((line) => lines.push(line));
  }
  lines.push("", "Orcamento sujeito aos servicos e condicoes descritos acima.");
  return buildPdf(lines);
}
