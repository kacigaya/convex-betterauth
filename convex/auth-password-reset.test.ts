import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { APIError } from "better-auth/api";
import {
  createTestAuth,
  linkFromEmail,
  postAuth,
  testBaseURL as baseURL,
  testEmail as email,
  testPassword as password,
  type TestAuth,
  verifyFirstEmail,
} from "./auth-test-utils";

const newPassword = "BetterBattery2";
const resetCallbackURL = "/reset-password";

async function requestReset(auth: TestAuth) {
  return auth.api.requestPasswordReset({
    body: { email, redirectTo: resetCallbackURL },
  });
}

describe("password reset", () => {
  test("request creates a token and sends the expected callback link", async () => {
    const { auth, database, emails } = createTestAuth();
    await auth.api.signUpEmail({
      body: { name: "Test User", email, password },
    });
    emails.length = 0;

    const result = await requestReset(auth);

    assert.deepEqual(result, {
      status: true,
      message:
        "If this email exists in our system, check your email for the reset link",
    });
    assert.equal(emails.length, 1);
    assert.equal(emails[0]?.to, email);
    const resetURL = linkFromEmail(emails[0], "/api/auth/reset-password/");
    assert.equal(resetURL.searchParams.get("callbackURL"), resetCallbackURL);
    const token = resetURL.pathname.split("/").at(-1);
    assert.ok(token);
    assert.ok(
      database.verification.some(
        (record) => record.identifier === `reset-password:${token}`,
      ),
    );
  });

  test("unknown email returns the same response without delivery", async () => {
    const { auth, emails } = createTestAuth();

    const result = await requestReset(auth);

    assert.deepEqual(result, {
      status: true,
      message:
        "If this email exists in our system, check your email for the reset link",
    });
    assert.equal(emails.length, 0);
  });

  test("valid callback redirects with its token", async () => {
    const { auth, emails } = createTestAuth();
    await auth.api.signUpEmail({ body: { name: "Test User", email, password } });
    emails.length = 0;
    await requestReset(auth);
    const resetURL = linkFromEmail(emails[0], "/api/auth/reset-password/");
    const token = resetURL.pathname.split("/").at(-1);
    assert.ok(token);

    const response = await auth.handler(new Request(resetURL));

    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("Location"),
      `${baseURL}${resetCallbackURL}?token=${token}`,
    );
  });

  test("invalid and expired callbacks redirect with INVALID_TOKEN", async () => {
    const invalidAuth = createTestAuth().auth;
    const invalidURL = new URL(
      "/api/auth/reset-password/invalid-token",
      baseURL,
    );
    invalidURL.searchParams.set("callbackURL", resetCallbackURL);
    const invalidResponse = await invalidAuth.handler(new Request(invalidURL));
    assert.equal(invalidResponse.status, 302);
    assert.equal(
      invalidResponse.headers.get("Location"),
      `${baseURL}${resetCallbackURL}?error=INVALID_TOKEN`,
    );

    const { auth, emails } = createTestAuth({
      resetPasswordTokenExpiresIn: -1,
    });
    await auth.api.signUpEmail({ body: { name: "Test User", email, password } });
    emails.length = 0;
    await requestReset(auth);
    const expiredResponse = await auth.handler(
      new Request(linkFromEmail(emails[0], "/api/auth/reset-password/")),
    );
    assert.equal(expiredResponse.status, 302);
    assert.equal(
      expiredResponse.headers.get("Location"),
      `${baseURL}${resetCallbackURL}?error=INVALID_TOKEN`,
    );
  });

  test("rejects a cross-origin callback", async () => {
    const { auth } = createTestAuth();
    await auth.api.signUpEmail({ body: { name: "Test User", email, password } });

    const response = await auth.handler(
      new Request(`${baseURL}/api/auth/request-password-reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: baseURL,
        },
        body: JSON.stringify({
          email,
          redirectTo: "https://attacker.example/reset",
        }),
      }),
    );

    assert.equal(response.status, 403);
  });

  test("rejects a weak new password without consuming the token", async () => {
    const { auth, emails } = createTestAuth();
    await auth.api.signUpEmail({ body: { name: "Test User", email, password } });
    emails.length = 0;
    await requestReset(auth);
    const token = linkFromEmail(
      emails[0],
      "/api/auth/reset-password/",
    ).pathname.split("/").at(-1);
    assert.ok(token);

    await assert.rejects(
      auth.api.resetPassword({ body: { token, newPassword: "weakpass" } }),
      (error: unknown) => {
        assert.ok(error instanceof APIError);
        assert.equal(error.status, "BAD_REQUEST");
        assert.match(error.message, /uppercase/);
        return true;
      },
    );

    assert.deepEqual(
      await auth.api.resetPassword({ body: { token, newPassword } }),
      { status: true },
    );
  });

  test("rejects an invalid token without changing the existing password", async () => {
    const { auth, emails } = createTestAuth();
    await auth.api.signUpEmail({
      body: {
        name: "Test User",
        email,
        password,
        callbackURL: "/email-verified",
      },
    });
    await verifyFirstEmail(auth, emails);

    await assert.rejects(
      auth.api.resetPassword({
        body: { token: "invalid-token", newPassword },
      }),
      (error: unknown) => {
        assert.ok(error instanceof APIError);
        assert.equal(error.body?.code, "INVALID_TOKEN");
        return true;
      },
    );

    const login = await auth.api.signInEmail({ body: { email, password } });
    assert.ok(login.token);
  });

  test("reset is single-use, changes the password, and revokes sessions", async () => {
    const { auth, database, emails } = createTestAuth();
    await auth.api.signUpEmail({
      body: {
        name: "Test User",
        email,
        password,
        callbackURL: "/email-verified",
      },
    });
    await verifyFirstEmail(auth, emails);
    const initialLogin = await auth.handler(
      postAuth("/sign-in/email", { email, password }),
    );
    const sessionCookie = initialLogin.headers
      .get("set-cookie")
      ?.match(/better-auth\.session_token=[^;]+/)?.[0];
    assert.ok(sessionCookie);
    assert.equal(database.session.length, 1);
    emails.length = 0;
    await requestReset(auth);
    const token = linkFromEmail(
      emails[0],
      "/api/auth/reset-password/",
    ).pathname.split("/").at(-1);
    assert.ok(token);

    assert.deepEqual(
      await auth.api.resetPassword({ body: { token, newPassword } }),
      { status: true },
    );
    assert.equal(database.session.length, 0);
    const previousSession = await auth.handler(
      new Request(`${baseURL}/api/auth/get-session`, {
        headers: { Cookie: sessionCookie },
      }),
    );
    assert.equal(await previousSession.json(), null);

    await assert.rejects(
      auth.api.resetPassword({ body: { token, newPassword } }),
      (error: unknown) => {
        assert.ok(error instanceof APIError);
        assert.equal(error.body?.code, "INVALID_TOKEN");
        return true;
      },
    );
    await assert.rejects(auth.api.signInEmail({ body: { email, password } }));
    const login = await auth.api.signInEmail({ body: { email, password: newPassword } });
    assert.ok(login.token);
  });

  test("delivery failure preserves the generic response", async () => {
    let deliveryAttempts = 0;
    const { auth } = createTestAuth({
      sendEmail: async (message) => {
        if (message.subject === "Reset your password") {
          deliveryAttempts += 1;
          throw new Error("provider details must not escape");
        }
      },
    });
    await auth.api.signUpEmail({ body: { name: "Test User", email, password } });

    const result = await requestReset(auth);

    assert.equal(result.status, true);
    assert.equal(
      result.message,
      "If this email exists in our system, check your email for the reset link",
    );
    assert.equal(deliveryAttempts, 1);
  });
});
