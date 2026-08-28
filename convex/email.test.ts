import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { sendResendEmail, type SendResendEmailOptions } from "./email";

const apiKey = "re_test_secret_key";
const recipient = "user@example.com";
const verificationLink =
  "https://example.com/api/auth/verify-email?token=sensitive-token";

function emailOptions(fetchImpl: typeof fetch): SendResendEmailOptions {
  return {
    apiKey,
    from: "Convex Better Auth <auth@example.com>",
    to: recipient,
    subject: "Verify your email address",
    text: `Verify your email address:\n${verificationLink}`,
    fetchImpl,
  };
}

function assertNoSensitiveData(message: string) {
  assert.equal(message.includes(apiKey), false);
  assert.equal(message.includes(recipient), false);
  assert.equal(message.includes(verificationLink), false);
}

describe("Resend email transport", () => {
  test("posts a plain-text email with the required request metadata", async () => {
    let requestURL = "";
    let requestInit: RequestInit | undefined;
    const fetchImpl: typeof fetch = async (input, init) => {
      requestURL = input.toString();
      requestInit = init;
      return new Response('{"id":"email-id"}', { status: 200 });
    };

    await sendResendEmail(emailOptions(fetchImpl));

    assert.equal(requestURL, "https://api.resend.com/emails");
    assert.equal(requestInit?.method, "POST");

    const headers = new Headers(requestInit?.headers);
    assert.equal(headers.get("Authorization"), `Bearer ${apiKey}`);
    assert.equal(headers.get("Content-Type"), "application/json");
    assert.equal(headers.get("User-Agent"), "convex-betterauth");

    const requestBody = requestInit?.body;
    assert.ok(typeof requestBody === "string");
    assert.deepEqual(JSON.parse(requestBody), {
      from: "Convex Better Auth <auth@example.com>",
      to: recipient,
      subject: "Verify your email address",
      text: `Verify your email address:\n${verificationLink}`,
    });
  });

  test("sanitizes network failures", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new Error(
        `Network failure for ${apiKey}, ${recipient}, ${verificationLink}`,
      );
    };

    await assert.rejects(
      sendResendEmail(emailOptions(fetchImpl)),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, "Resend email request failed");
        assertNoSensitiveData(error.message);
        return true;
      },
    );
  });

  test("rejects non-success responses without exposing provider content", async () => {
    const providerBody = `Invalid request for ${apiKey}, ${recipient}, ${verificationLink}`;
    const fetchImpl: typeof fetch = async () =>
      new Response(providerBody, { status: 422 });

    await assert.rejects(
      sendResendEmail(emailOptions(fetchImpl)),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(
          error.message,
          "Resend email request failed with status 422",
        );
        assert.equal(error.message.includes(providerBody), false);
        assertNoSensitiveData(error.message);
        return true;
      },
    );
  });
});
