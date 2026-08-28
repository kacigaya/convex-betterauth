import assert from "node:assert/strict";
import { memoryAdapter, type MemoryDB } from "better-auth/adapters/memory";
import { betterAuth } from "better-auth/minimal";
import {
  createAuthOptions,
  type AuthEmailMessage,
} from "./auth-options";

export const testBaseURL = "http://localhost:3000";
export const testEmail = "user@example.com";
export const testPassword = "CorrectHorse1";
export const testSecret = "test-secret-with-at-least-thirty-two-characters";

export function createMemoryDatabase(): MemoryDB {
  return {
    user: [],
    session: [],
    account: [],
    verification: [],
    rateLimit: [],
    jwks: [],
  };
}

export function createTestAuth({
  emailVerificationExpiresIn,
  resetPasswordTokenExpiresIn,
  sendEmail,
  socialProviders = {},
}: {
  emailVerificationExpiresIn?: number;
  resetPasswordTokenExpiresIn?: number;
  sendEmail?: (message: AuthEmailMessage) => Promise<void>;
  socialProviders?: Parameters<typeof createAuthOptions>[0]["socialProviders"];
} = {}) {
  const database = createMemoryDatabase();
  const emails: AuthEmailMessage[] = [];
  const deliver =
    sendEmail ??
    (async (message: AuthEmailMessage) => {
      emails.push(message);
    });

  const auth = betterAuth({
    ...createAuthOptions({
      baseURL: testBaseURL,
      secret: testSecret,
      database: memoryAdapter(database),
      socialProviders,
      sendEmail: deliver,
      emailVerificationExpiresIn,
      resetPasswordTokenExpiresIn,
    }),
    logger: { disabled: true },
    advanced: { disableOriginCheck: false },
    plugins: [],
  });

  return { auth, database, emails };
}

export type TestAuth = ReturnType<typeof createTestAuth>["auth"];

export function linkFromEmail(message: AuthEmailMessage, path: string) {
  const url = message.text
    .split("\n")
    .find((line) => line.startsWith(`${testBaseURL}${path}`));
  assert.ok(url, `email should contain a ${path} link`);
  return new URL(url);
}

export async function verifyFirstEmail(
  auth: TestAuth,
  emails: AuthEmailMessage[],
) {
  await auth.handler(
    new Request(linkFromEmail(emails[0], "/api/auth/verify-email")),
  );
}

export function postAuth(path: string, body: Record<string, unknown>) {
  return new Request(`${testBaseURL}/api/auth${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: testBaseURL,
    },
    body: JSON.stringify(body),
  });
}
