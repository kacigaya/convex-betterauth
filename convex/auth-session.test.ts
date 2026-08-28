import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createTestAuth,
  postAuth,
  testBaseURL,
  testEmail,
  testPassword,
  verifyFirstEmail,
} from "./auth-test-utils";

const registration = {
  name: "Session User",
  email: testEmail,
  password: testPassword,
  callbackURL: "/email-verified",
};

function cookieFrom(response: Response) {
  const cookie = response.headers
    .get("set-cookie")
    ?.match(/better-auth\.session_token=[^;]+/)?.[0];
  assert.ok(cookie, "login should set a session cookie");
  return cookie;
}

function sessionRequest(cookie?: string) {
  return new Request(`${testBaseURL}/api/auth/get-session`, {
    headers: cookie ? { Cookie: cookie } : undefined,
  });
}

async function createVerifiedSession() {
  const testAuth = createTestAuth();
  await testAuth.auth.handler(postAuth("/sign-up/email", registration));
  await verifyFirstEmail(testAuth.auth, testAuth.emails);
  const login = await testAuth.auth.handler(
    postAuth("/sign-in/email", {
      email: testEmail,
      password: testPassword,
    }),
  );

  assert.equal(login.status, 200);
  return { ...testAuth, cookie: cookieFrom(login) };
}

describe("session lifecycle", () => {
  test("creates a cookie-backed session that persists across requests", async () => {
    const { auth, database, cookie } = await createVerifiedSession();

    const first = await auth.handler(sessionRequest(cookie));
    const second = await auth.handler(sessionRequest(cookie));
    const firstBody = (await first.json()) as {
      session: { id: string };
      user: { email: string };
    };
    const secondBody = (await second.json()) as typeof firstBody;

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(firstBody.user.email, testEmail);
    assert.equal(secondBody.session.id, firstBody.session.id);
    assert.equal(database.session.length, 1);
  });

  test("logout removes the session and clears authenticated retrieval", async () => {
    const { auth, database, cookie } = await createVerifiedSession();

    const logout = await auth.handler(
      new Request(`${testBaseURL}/api/auth/sign-out`, {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: testBaseURL,
        },
      }),
    );

    assert.equal(logout.status, 200);
    assert.deepEqual(await logout.json(), { success: true });
    assert.equal(database.session.length, 0);
    assert.equal(await (await auth.handler(sessionRequest(cookie))).json(), null);
  });

  test("returns no session without a cookie or with an invalid cookie", async () => {
    const { auth } = createTestAuth();

    const anonymous = await auth.handler(sessionRequest());
    const invalid = await auth.handler(
      sessionRequest("better-auth.session_token=invalid-token"),
    );

    assert.equal(anonymous.status, 200);
    assert.equal(invalid.status, 200);
    assert.equal(await anonymous.json(), null);
    assert.equal(await invalid.json(), null);
  });

  test("does not retrieve an expired session", async () => {
    const { auth, database, cookie } = await createVerifiedSession();
    const session = database.session[0];
    assert.ok(session);
    session.expiresAt = new Date(Date.now() - 1_000);

    const response = await auth.handler(sessionRequest(cookie));

    assert.equal(response.status, 200);
    assert.equal(await response.json(), null);
  });
});
