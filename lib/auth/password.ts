import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export interface PasswordDigest {
  hash: string;
  salt: string;
}

async function deriveKey(password: string, salt: string): Promise<Buffer> {
  return (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
}

export async function hashPassword(password: string): Promise<PasswordDigest> {
  const salt = randomBytes(16).toString("hex");
  const key = await deriveKey(password, salt);

  return { hash: key.toString("hex"), salt };
}

export async function verifyPassword(
  password: string,
  digest: PasswordDigest
): Promise<boolean> {
  const stored = Buffer.from(digest.hash, "hex");
  const supplied = await deriveKey(password, digest.salt);

  return stored.length === supplied.length && timingSafeEqual(stored, supplied);
}
