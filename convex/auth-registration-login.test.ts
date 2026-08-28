import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createTestAuth,
  postAuth,
  testEmail,
  testPassword,
  verifyFirstEmail,
} from "./auth-test-utils";

const validRegistration = {
  name: "Test User",
  email: testEmail,
  password: testPassword,
  callbackURL: "/email-verified",
};

async function responseBody(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("email registration", () => {
  test("accepts valid input, normalizes the name, and requires verification", async () => {
    const { auth, database, emails } = createTestAuth();

    const response = await auth.handler(
      postAuth("/sign-up/email", {
        ...validRegistration,
        name: "  Test User  ",
      }),
    );
    const body = await responseBody(response);

    assert.equal(response.status, 200);
    assert.equal(body.token, null);
    assert.equal(database.user[0]?.name, "Test User");
    assert.equal(database.user[0]?.emailVerified, false);
    assert.equal(database.session.length, 0);
    assert.equal(emails.length, 1);
  });

  test("rejects invalid email and password input without creating a user", async () => {
    const cases = [
      { ...validRegistration, email: "not-an-email" },
      { ...validRegistration, password: "weakpass" },
    ];

    for (const body of cases) {
      const { auth, database, emails } = createTestAuth();
      const response = await auth.handler(postAuth("/sign-up/email", body));

      assert.equal(response.status, 400);
      assert.equal(database.user.length, 0);
      assert.equal(database.session.length, 0);
      assert.equal(emails.length, 0);
    }
  });

  test("rejects missing required fields without creating a user", async () => {
    const cases = [
      { email: testEmail, password: testPassword },
      { name: "Test User", password: testPassword },
      { name: "Test User", email: testEmail },
    ];

    for (const body of cases) {
      const { auth, database } = createTestAuth();
      const response = await auth.handler(postAuth("/sign-up/email", body));

      assert.equal(response.status, 400);
      assert.equal(database.user.length, 0);
      assert.equal(database.session.length, 0);
    }
  });

  test("returns the same safe result for duplicate registration", async () => {
    const { auth, database } = createTestAuth();
    const first = await auth.handler(
      postAuth("/sign-up/email", validRegistration),
    );
    const duplicate = await auth.handler(
      postAuth("/sign-up/email", validRegistration),
    );

    assert.equal(first.status, 200);
    assert.equal(duplicate.status, first.status);
    const firstBody = await responseBody(first);
    const duplicateBody = await responseBody(duplicate);
    assert.deepEqual(Object.keys(duplicateBody).sort(), Object.keys(firstBody).sort());
    assert.equal(duplicateBody.token, firstBody.token);
    assert.equal(
      (duplicateBody.user as { email: string }).email,
      (firstBody.user as { email: string }).email,
    );
    assert.equal(
      (duplicateBody.user as { emailVerified: boolean }).emailVerified,
      (firstBody.user as { emailVerified: boolean }).emailVerified,
    );
    assert.equal(database.user.length, 1);
    assert.equal(database.session.length, 0);
  });
});

describe("email login", () => {
  test("creates a session for a verified account", async () => {
    const { auth, database, emails } = createTestAuth();
    await auth.handler(postAuth("/sign-up/email", validRegistration));
    await verifyFirstEmail(auth, emails);

    const response = await auth.handler(
      postAuth("/sign-in/email", { email: testEmail, password: testPassword }),
    );
    const body = await responseBody(response);

    assert.equal(response.status, 200);
    assert.equal((body.user as { email: string }).email, testEmail);
    assert.equal(database.session.length, 1);
    assert.match(response.headers.get("set-cookie") ?? "", /better-auth\.session_token=/);
  });

  test("uses the same generic failure for a bad password and unknown account", async () => {
    const { auth, emails } = createTestAuth();
    await auth.handler(postAuth("/sign-up/email", validRegistration));
    await verifyFirstEmail(auth, emails);

    const badPassword = await auth.handler(
      postAuth("/sign-in/email", { email: testEmail, password: "WrongPassword1" }),
    );
    const unknownAccount = await auth.handler(
      postAuth("/sign-in/email", {
        email: "unknown@example.com",
        password: "WrongPassword1",
      }),
    );

    assert.equal(badPassword.status, 401);
    assert.equal(unknownAccount.status, badPassword.status);
    assert.deepEqual(
      await responseBody(unknownAccount),
      await responseBody(badPassword),
    );
  });

  test("rejects an unverified account without creating a session", async () => {
    const { auth, database } = createTestAuth();
    await auth.handler(postAuth("/sign-up/email", validRegistration));

    const response = await auth.handler(
      postAuth("/sign-in/email", { email: testEmail, password: testPassword }),
    );
    const body = await responseBody(response);

    assert.equal(response.status, 403);
    assert.equal(body.code, "EMAIL_NOT_VERIFIED");
    assert.equal(database.session.length, 0);
  });
});
