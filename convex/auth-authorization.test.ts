import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { AuthEmailMessage } from "./auth-options";
import {
  createTestAuth,
  linkFromEmail,
  postAuth,
  testBaseURL,
  testPassword,
} from "./auth-test-utils";

function sessionCookie(response: Response) {
  const cookie = response.headers
    .get("set-cookie")
    ?.match(/better-auth\.session_token=[^;]+/)?.[0];
  assert.ok(cookie);
  return cookie;
}

async function registerAndLogin(
  auth: ReturnType<typeof createTestAuth>["auth"],
  emails: AuthEmailMessage[],
  email: string,
) {
  const emailIndex = emails.length;
  await auth.handler(
    postAuth("/sign-up/email", {
      name: email,
      email,
      password: testPassword,
      callbackURL: "/email-verified",
    }),
  );
  const verification = emails[emailIndex];
  assert.ok(verification);
  await auth.handler(
    new Request(linkFromEmail(verification, "/api/auth/verify-email")),
  );

  const response = await auth.handler(
    postAuth("/sign-in/email", { email, password: testPassword }),
  );
  assert.equal(response.status, 200);
  return sessionCookie(response);
}

async function currentSessionEmail(
  auth: ReturnType<typeof createTestAuth>["auth"],
  cookie?: string,
) {
  const response = await auth.handler(
    new Request(`${testBaseURL}/api/auth/get-session`, {
      headers: cookie ? { Cookie: cookie } : undefined,
    }),
  );
  const body = (await response.json()) as null | { user: { email: string } };
  return body?.user.email ?? null;
}

describe("identity-bound authorization", () => {
  test("returns only the user bound to each server-validated session", async () => {
    const { auth, emails } = createTestAuth();
    const userA = "user-a@example.com";
    const userB = "user-b@example.com";
    const cookieA = await registerAndLogin(auth, emails, userA);
    const cookieB = await registerAndLogin(auth, emails, userB);

    assert.equal(await currentSessionEmail(auth), null);
    assert.equal(await currentSessionEmail(auth, cookieA), userA);
    assert.equal(await currentSessionEmail(auth, cookieB), userB);
  });

  test("the Convex current-user query derives identity from context, not caller input", async () => {
    const originalEnvironment = {
      siteUrl: process.env.SITE_URL,
      secret: process.env.BETTER_AUTH_SECRET,
      resendApiKey: process.env.RESEND_API_KEY,
      emailFrom: process.env.EMAIL_FROM,
    };
    process.env.SITE_URL = testBaseURL;
    process.env.BETTER_AUTH_SECRET =
      "test-secret-with-at-least-thirty-two-characters";
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "auth@example.com";

    try {
      const { authComponent, getCurrentUser } = await import("./auth");
      const originalResolver = Object.getOwnPropertyDescriptor(
        authComponent,
        "safeGetAuthUser",
      );
      assert.ok(originalResolver);

      const anonymousContext = { session: "anonymous" };
      const userAContext = { session: "session-a" };
      const userBContext = { session: "session-b" };
      const identities = new Map<object, null | { id: string; email: string }>([
        [anonymousContext, null],
        [userAContext, { id: "user-a", email: "user-a@example.com" }],
        [userBContext, { id: "user-b", email: "user-b@example.com" }],
      ]);

      Object.defineProperty(authComponent, "safeGetAuthUser", {
        configurable: true,
        value: async (context: object) => identities.get(context) ?? null,
      });

      try {
        const handler: unknown = Reflect.get(getCurrentUser, "_handler");
        assert.ok(typeof handler === "function");
        const invoke = (context: object, args: object = {}) =>
          Reflect.apply(handler, undefined, [context, args]);

        assert.equal(await invoke(anonymousContext), null);
        assert.deepEqual(await invoke(userAContext), identities.get(userAContext));
        assert.deepEqual(await invoke(userBContext), identities.get(userBContext));
        assert.deepEqual(
          await invoke(userAContext, { userId: "user-b" }),
          identities.get(userAContext),
        );
      } finally {
        Object.defineProperty(
          authComponent,
          "safeGetAuthUser",
          originalResolver,
        );
      }
    } finally {
      restoreEnvironment("SITE_URL", originalEnvironment.siteUrl);
      restoreEnvironment("BETTER_AUTH_SECRET", originalEnvironment.secret);
      restoreEnvironment("RESEND_API_KEY", originalEnvironment.resendApiKey);
      restoreEnvironment("EMAIL_FROM", originalEnvironment.emailFrom);
    }
  });
});

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
