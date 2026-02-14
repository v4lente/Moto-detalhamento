import { createHash, scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  if (!stored || typeof stored !== "string") {
    return false;
  }

  const normalizedStored = stored.trim();
  if (!normalizedStored) {
    return false;
  }

  // Current format: "<scryptHex>.<saltHex>"
  if (normalizedStored.includes(".")) {
    const [hashed, salt, ...extraSegments] = normalizedStored.split(".");
    if (!hashed || !salt || extraSegments.length > 0) {
      return false;
    }

    try {
      const expected = Buffer.from(hashed, "hex");
      const derived = (await scryptAsync(supplied, salt, 64)) as Buffer;

      // Prevent timingSafeEqual from throwing on malformed legacy values.
      if (expected.length !== derived.length) {
        return false;
      }

      return timingSafeEqual(expected, derived);
    } catch {
      return false;
    }
  }

  // Backward compatibility for legacy SHA-512 and SHA-256 unsalted hashes.
  if (/^[a-f0-9]+$/i.test(normalizedStored)) {
    if (normalizedStored.length === 128) {
      const suppliedSha512 = createHash("sha512").update(supplied).digest("hex");
      return timingSafeEqual(Buffer.from(suppliedSha512, "hex"), Buffer.from(normalizedStored, "hex"));
    }
    if (normalizedStored.length === 64) {
      const suppliedSha256 = createHash("sha256").update(supplied).digest("hex");
      return timingSafeEqual(Buffer.from(suppliedSha256, "hex"), Buffer.from(normalizedStored, "hex"));
    }
  }

  // Last-resort fallback for accidental plaintext data.
  return supplied === normalizedStored;
}

export function shouldRehashPassword(stored: string): boolean {
  const normalizedStored = stored.trim();
  const [hashed, salt, ...extraSegments] = normalizedStored.split(".");

  if (!hashed || !salt || extraSegments.length > 0) {
    return true;
  }

  return Buffer.from(hashed, "hex").length !== 64;
}
