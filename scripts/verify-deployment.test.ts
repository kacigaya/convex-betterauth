import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  parseDeploymentOrigin,
  verifyDeployment,
} from "./verify-deployment";

describe("deployment smoke check", () => {
  test("requires a bare HTTPS deployment origin", () => {
    assert.equal(
      parseDeploymentOrigin("https://app.example.com"),
      "https://app.example.com",
    );

    for (const invalid of [
      undefined,
      "http://app.example.com",
      "https://user:secret@app.example.com",
      "https://app.example.com/path",
      "https://app.example.com?debug=true",
      "not-a-url",
    ]) {
      assert.throws(() => parseDeploymentOrigin(invalid));
    }
  });

  test("uses only anonymous GET requests for expected routes", async () => {
    const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
    const output: string[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      requests.push({ url: input.toString(), init });
      const body = input.toString().endsWith("/api/auth/get-session")
        ? "null"
        : "ok";
      return new Response(body, { status: 200 });
    };

    await verifyDeployment("https://app.example.com", {
      fetchImpl,
      timeoutMs: 100,
      log: (message) => output.push(message),
    });

    assert.deepEqual(
      requests.map(({ url }) => url),
      [
        "https://app.example.com/",
        "https://app.example.com/login",
        "https://app.example.com/register",
        "https://app.example.com/forgot-password",
        "https://app.example.com/reset-password",
        "https://app.example.com/email-verified",
        "https://app.example.com/api/auth/get-session",
      ],
    );
    for (const { init } of requests) {
      assert.equal(init?.method, "GET");
      assert.equal(init?.credentials, "omit");
      assert.equal(init?.redirect, "manual");
      assert.equal(new Headers(init?.headers).has("Cookie"), false);
      assert.equal(init?.body, undefined);
    }
    assert.equal(output.length, requests.length);
  });

  test("fails on redirects, errors, and authenticated sessions", async () => {
    await assert.rejects(
      verifyDeployment("https://app.example.com", {
        fetchImpl: async () => new Response(null, { status: 302 }),
        log: () => {},
      }),
      /returned HTTP 302/,
    );

    await assert.rejects(
      verifyDeployment("https://app.example.com", {
        fetchImpl: async (input) => {
          return new Response(
            input.toString().endsWith("/api/auth/get-session")
              ? JSON.stringify({ user: { id: "user-1" } })
              : "ok",
            { status: 200 },
          );
        },
        log: () => {},
      }),
      /returned an authenticated session/,
    );
  });

  test("reports an invalid anonymous session response", async () => {
    await assert.rejects(
      verifyDeployment("https://app.example.com", {
        fetchImpl: async (input) => {
          return new Response(
            input.toString().endsWith("/api/auth/get-session")
              ? "not-json"
              : "ok",
            { status: 200 },
          );
        },
        log: () => {},
      }),
      /\/api\/auth\/get-session returned invalid JSON/,
    );
  });
});
