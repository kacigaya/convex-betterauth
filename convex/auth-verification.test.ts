import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { APIError } from "better-auth/api";
import type { AuthEmailMessage } from "./auth-options";
import {
  createTestAuth,
  testBaseURL as baseURL,
  testEmail as email,
  testPassword as password,
} from "./auth-test-utils";

const callbackURL = "/verification-result";

async function signUp(
  auth: ReturnType<typeof createTestAuth>["auth"],
) {
  return auth.api.signUpEmail({
    body: {
      name: "Test User",
      email,
      password,
      callbackURL,
    },
  });
}

function verificationURL(message: AuthEmailMessage) {
  const url = message.text
    .split("\n")
    .find((line) => line.startsWith(`${baseURL}/api/auth/verify-email?`));
  assert.ok(url, "verification email should contain a callback URL");
  return url;
}

describe("email verification", () => {
  test("signup sends one verification email without creating a session", async () => {
    const { auth, database, emails } = createTestAuth();

    const result = await signUp(auth);

    assert.equal(result.token, null);
    assert.equal(result.user.emailVerified, false);
    assert.equal(database.session.length, 0);
    assert.equal(emails.length, 1);
    assert.equal(emails[0]?.to, email);
    assert.match(verificationURL(emails[0]), /callbackURL=%2Fverification-result/);
  });

  test("unverified login is forbidden and sends another verification email", async () => {
    const { auth, database, emails } = createTestAuth();
    await signUp(auth);

    await assert.rejects(
      auth.api.signInEmail({ body: { email, password, callbackURL } }),
      (error: unknown) => {
        assert.ok(error instanceof APIError);
        assert.equal(error.status, "FORBIDDEN");
        assert.equal(error.body?.code, "EMAIL_NOT_VERIFIED");
        return true;
      },
    );

    assert.equal(database.session.length, 0);
    assert.equal(emails.length, 2);
    assert.equal(emails[1]?.to, email);
  });

  test("valid verification marks the email verified and permits login", async () => {
    const { auth, emails } = createTestAuth();
    await signUp(auth);

    const verificationResponse = await auth.handler(
      new Request(verificationURL(emails[0])),
    );

    assert.equal(verificationResponse.status, 302);
    assert.equal(verificationResponse.headers.get("Location"), callbackURL);

    const login = await auth.api.signInEmail({ body: { email, password } });
    assert.equal(login.user.emailVerified, true);
    assert.ok(login.token);
  });

  test("invalid verification token redirects with INVALID_TOKEN", async () => {
    const { auth } = createTestAuth();
    const url = new URL("/api/auth/verify-email", baseURL);
    url.searchParams.set("token", "invalid-token");
    url.searchParams.set("callbackURL", callbackURL);

    const response = await auth.handler(new Request(url));

    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("Location"),
      `${callbackURL}?error=INVALID_TOKEN`,
    );
  });

  test("expired verification token redirects with TOKEN_EXPIRED", async () => {
    const { auth, emails } = createTestAuth({
      emailVerificationExpiresIn: -1,
    });
    await signUp(auth);

    const response = await auth.handler(
      new Request(verificationURL(emails[0])),
    );

    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("Location"),
      `${callbackURL}?error=TOKEN_EXPIRED`,
    );
  });

  test("delivery failure does not expose account existence or create a session", async () => {
    let deliveryAttempts = 0;
    const { auth, database } = createTestAuth({
      sendEmail: async () => {
        deliveryAttempts += 1;
        throw new Error("delivery failed");
      },
    });

    const first = await signUp(auth);
    const duplicate = await signUp(auth);

    assert.equal(first.token, null);
    assert.equal(duplicate.token, null);
    assert.deepEqual(Object.keys(duplicate).sort(), Object.keys(first).sort());
    assert.equal(first.user.emailVerified, false);
    assert.equal(duplicate.user.emailVerified, false);
    assert.equal(database.session.length, 0);
    assert.equal(deliveryAttempts, 1);
  });
});
