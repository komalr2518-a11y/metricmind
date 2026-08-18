import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "../lib/auth/password";
import { validateCredentials } from "../lib/auth/validation";

test("registration credentials are normalized and validated", () => {
  const result = validateCredentials(
    { username: "  Alice.Test  ", password: "secure123" },
    { requireStrongPassword: true }
  );

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.credentials.username, "alice.test");
});

test("registration rejects weak passwords and invalid usernames", () => {
  const weakPassword = validateCredentials(
    { username: "alice", password: "password" },
    { requireStrongPassword: true }
  );
  const invalidUsername = validateCredentials(
    { username: "bad user", password: "secure123" },
    { requireStrongPassword: true }
  );

  assert.equal(weakPassword.ok, false);
  assert.equal(invalidUsername.ok, false);
});

test("password hashes verify without storing the original password", async () => {
  const password = "correct-horse-42";
  const digest = await hashPassword(password);

  assert.notEqual(digest.hash, password);
  assert.equal(await verifyPassword(password, digest), true);
  assert.equal(await verifyPassword("incorrect-password-42", digest), false);
});
