import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { hashPassword, verifyPassword } from "./password";
import type { PublicUser } from "./types";

const STORE_VERSION = 1;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1_000;
const MAX_SESSIONS_PER_USER = 10;
const AUTH_DIRECTORY = path.join(process.cwd(), ".data");
const AUTH_FILE = path.join(AUTH_DIRECTORY, "auth.json");

interface StoredUser extends PublicUser {
  passwordHash: string;
  passwordSalt: string;
}

interface StoredSession {
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

interface AuthStore {
  version: number;
  users: StoredUser[];
  sessions: StoredSession[];
}

export interface AuthenticatedSession {
  user: PublicUser;
  token: string;
  expiresAt: Date;
}

export class UsernameTakenError extends Error {
  constructor() {
    super("Username is already registered.");
    this.name = "UsernameTakenError";
  }
}

let operationQueue: Promise<void> = Promise.resolve();

function emptyStore(): AuthStore {
  return { version: STORE_VERSION, users: [], sessions: [] };
}

function isAuthStore(value: unknown): value is AuthStore {
  if (typeof value !== "object" || value === null) return false;
  const store = value as Partial<AuthStore>;
  return (
    store.version === STORE_VERSION &&
    Array.isArray(store.users) &&
    Array.isArray(store.sessions)
  );
}

async function readStore(): Promise<AuthStore> {
  try {
    const contents = await readFile(AUTH_FILE, "utf8");
    const parsed: unknown = JSON.parse(contents);
    if (!isAuthStore(parsed)) throw new Error("Authentication store is invalid.");
    return parsed;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return emptyStore();
    }
    throw error;
  }
}

async function writeStore(store: AuthStore): Promise<void> {
  await mkdir(AUTH_DIRECTORY, { recursive: true });
  const temporaryFile = `${AUTH_FILE}.${process.pid}.${randomBytes(4).toString(
    "hex"
  )}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(store, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporaryFile, AUTH_FILE);
}

function runSerialized<T>(operation: () => Promise<T>): Promise<T> {
  const result = operationQueue.then(operation, operation);
  operationQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function publicUser(user: StoredUser): PublicUser {
  return { id: user.id, username: user.username, createdAt: user.createdAt };
}

function removeExpiredSessions(store: AuthStore, now = Date.now()): boolean {
  const active = store.sessions.filter(
    (session) => Date.parse(session.expiresAt) > now
  );
  const changed = active.length !== store.sessions.length;
  store.sessions = active;
  return changed;
}

function addSession(store: AuthStore, userId: string): AuthenticatedSession {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  const existing = store.sessions
    .filter((session) => session.userId === userId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const retainedHashes = new Set(
    existing.slice(0, MAX_SESSIONS_PER_USER - 1).map((session) => session.tokenHash)
  );
  store.sessions = store.sessions.filter(
    (session) => session.userId !== userId || retainedHashes.has(session.tokenHash)
  );
  store.sessions.push({
    tokenHash: tokenHash(token),
    userId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });

  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("Cannot create a session for an unknown user.");

  return { user: publicUser(user), token, expiresAt };
}

export async function registerUser(
  username: string,
  password: string
): Promise<AuthenticatedSession> {
  const digest = await hashPassword(password);

  return runSerialized(async () => {
    const store = await readStore();
    removeExpiredSessions(store);

    if (store.users.some((user) => user.username === username)) {
      throw new UsernameTakenError();
    }

    const user: StoredUser = {
      id: randomUUID(),
      username,
      passwordHash: digest.hash,
      passwordSalt: digest.salt,
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    const session = addSession(store, user.id);
    await writeStore(store);
    return session;
  });
}

export async function loginUser(
  username: string,
  password: string
): Promise<AuthenticatedSession | null> {
  return runSerialized(async () => {
    const store = await readStore();
    const changed = removeExpiredSessions(store);
    const user = store.users.find((item) => item.username === username);

    if (!user) {
      await hashPassword(password);
      if (changed) await writeStore(store);
      return null;
    }

    const valid = await verifyPassword(password, {
      hash: user.passwordHash,
      salt: user.passwordSalt,
    });
    if (!valid) {
      if (changed) await writeStore(store);
      return null;
    }

    const session = addSession(store, user.id);
    await writeStore(store);
    return session;
  });
}

export async function getUserBySessionToken(
  token: string
): Promise<PublicUser | null> {
  const hashedToken = tokenHash(token);

  return runSerialized(async () => {
    const store = await readStore();
    const changed = removeExpiredSessions(store);
    const session = store.sessions.find(
      (item) => item.tokenHash === hashedToken
    );
    const user = session
      ? store.users.find((item) => item.id === session.userId)
      : undefined;

    if (changed) await writeStore(store);
    return user ? publicUser(user) : null;
  });
}

export async function deleteSession(token: string): Promise<void> {
  const hashedToken = tokenHash(token);

  await runSerialized(async () => {
    const store = await readStore();
    removeExpiredSessions(store);
    store.sessions = store.sessions.filter(
      (session) => session.tokenHash !== hashedToken
    );
    await writeStore(store);
  });
}
