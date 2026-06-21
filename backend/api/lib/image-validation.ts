import fs from "fs";
import path from "path";
import { resolveUploadsReadDirs } from "./uploads-dir";

type ValidationResult = {
  valid: boolean;
  message?: string;
};

type ProductImagePayload = {
  image?: unknown;
  images?: unknown;
};

type SettingsImagePayload = {
  logoImage?: unknown;
  backgroundImage?: unknown;
};

type ServicePostMediaPayload = {
  mediaUrls?: unknown;
  mediaTypes?: unknown;
};

function isRemoteImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveSafePublicPath(baseDir: string, publicPrefix: string, value: string): string | null {
  const relativePath = value.slice(publicPrefix.length);

  if (!relativePath || path.isAbsolute(relativePath)) {
    return null;
  }

  const resolvedPath = path.resolve(baseDir, relativePath);
  const normalizedBase = path.resolve(baseDir);

  if (resolvedPath !== normalizedBase && !resolvedPath.startsWith(`${normalizedBase}${path.sep}`)) {
    return null;
  }

  return resolvedPath;
}

function pathExistsInPublicRoots(
  roots: Array<{ prefix: string; baseDir: string }>,
  imagePath: string,
): boolean {
  return roots.some((root) => {
    if (!imagePath.startsWith(root.prefix)) {
      return false;
    }

    const resolvedPath = resolveSafePublicPath(root.baseDir, root.prefix, imagePath);
    return Boolean(resolvedPath && fs.existsSync(resolvedPath));
  });
}

export function validatePublicImagePath(value: unknown, fieldLabel: string): ValidationResult {
  if (typeof value !== "string" || !value.trim()) {
    return { valid: false, message: `${fieldLabel} e obrigatoria.` };
  }

  const imagePath = value.trim();

  if (isRemoteImageUrl(imagePath)) {
    return { valid: true };
  }

  const localRoots = [
    ...resolveUploadsReadDirs().map((baseDir) => ({ prefix: "/uploads/", baseDir })),
    { prefix: "/assets/", baseDir: path.resolve(process.cwd(), "attached_assets") },
  ];

  if (!localRoots.some((root) => imagePath.startsWith(root.prefix))) {
    return {
      valid: false,
      message: `${fieldLabel} deve ser uma imagem enviada pelo admin ou uma URL http(s).`,
    };
  }

  if (!pathExistsInPublicRoots(localRoots, imagePath)) {
    return {
      valid: false,
      message: `${fieldLabel} nao foi encontrada no servidor. Reenvie a imagem antes de salvar.`,
    };
  }

  return { valid: true };
}

export function validateOptionalPublicImagePath(value: unknown, fieldLabel: string): ValidationResult {
  if (value === undefined || value === null) {
    return { valid: true };
  }

  if (typeof value === "string" && !value.trim()) {
    return { valid: true };
  }

  return validatePublicImagePath(value, fieldLabel);
}

export function validateProductImagePayload(
  payload: ProductImagePayload,
  options: { requireMainImage: boolean },
): ValidationResult {
  if (options.requireMainImage || Object.prototype.hasOwnProperty.call(payload, "image")) {
    const mainImageValidation = validatePublicImagePath(payload.image, "Imagem principal");
    if (!mainImageValidation.valid) {
      return mainImageValidation;
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, "images")) {
    if (!Array.isArray(payload.images)) {
      return { valid: false, message: "Fotos adicionais devem ser uma lista de imagens." };
    }

    for (let index = 0; index < payload.images.length; index++) {
      const image = payload.images[index];
      const validation = validatePublicImagePath(image, `Foto adicional ${index + 1}`);
      if (!validation.valid) {
        return validation;
      }
    }
  }

  return { valid: true };
}

export function validateSettingsImagePayload(payload: SettingsImagePayload): ValidationResult {
  if (Object.prototype.hasOwnProperty.call(payload, "logoImage")) {
    const validation = validateOptionalPublicImagePath(payload.logoImage, "Logo");
    if (!validation.valid) {
      return validation;
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, "backgroundImage")) {
    const validation = validateOptionalPublicImagePath(payload.backgroundImage, "Imagem de fundo");
    if (!validation.valid) {
      return validation;
    }
  }

  return { valid: true };
}

export function validateServicePostMediaPayload(payload: ServicePostMediaPayload): ValidationResult {
  if (!Object.prototype.hasOwnProperty.call(payload, "mediaUrls")) {
    return { valid: true };
  }

  if (!Array.isArray(payload.mediaUrls)) {
    return { valid: false, message: "Midias devem ser uma lista." };
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, "mediaTypes") &&
    payload.mediaTypes !== undefined &&
    !Array.isArray(payload.mediaTypes)
  ) {
    return { valid: false, message: "Tipos de midia devem ser uma lista." };
  }

  const mediaTypes = Array.isArray(payload.mediaTypes) ? payload.mediaTypes : [];
  for (let index = 0; index < payload.mediaUrls.length; index++) {
    const mediaType = mediaTypes[index] || "image";
    if (mediaType !== "image") {
      continue;
    }

    const validation = validatePublicImagePath(payload.mediaUrls[index], `Midia ${index + 1}`);
    if (!validation.valid) {
      return validation;
    }
  }

  return { valid: true };
}
