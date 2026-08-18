export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const USERNAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export interface Credentials {
  username: string;
  password: string;
}

type ValidationResult =
  | { ok: true; credentials: Credentials }
  | { ok: false; error: string };

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function validateCredentials(
  value: unknown,
  options: { requireStrongPassword: boolean }
): ValidationResult {
  if (typeof value !== "object" || value === null) {
    return { ok: false, error: "Username and password are required." };
  }

  const body = value as Record<string, unknown>;
  const username =
    typeof body.username === "string" ? normalizeUsername(body.username) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (
    username.length < USERNAME_MIN_LENGTH ||
    username.length > USERNAME_MAX_LENGTH ||
    !USERNAME_PATTERN.test(username)
  ) {
    return {
      ok: false,
      error:
        "Username must be 3–24 characters and use only letters, numbers, dots, underscores, or hyphens.",
    };
  }

  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    return {
      ok: false,
      error: "Password must be between 8 and 128 characters.",
    };
  }

  if (
    options.requireStrongPassword &&
    (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
  ) {
    return {
      ok: false,
      error: "Password must contain at least one letter and one number.",
    };
  }

  return { ok: true, credentials: { username, password } };
}
