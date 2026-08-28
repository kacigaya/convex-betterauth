import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getGoogleSocialProviders } from "./auth-options";

describe("Google OAuth configuration", () => {
  test("configures Google only when both credentials are present", () => {
    const providers = getGoogleSocialProviders({
      clientId: "  test-client-id  ",
      clientSecret: "  test-client-secret  ",
    });

    assert.deepEqual(providers, {
      google: {
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
      },
    });
  });

  test("safely disables Google when neither credential is present", () => {
    assert.deepEqual(getGoogleSocialProviders({}), {});
    assert.deepEqual(
      getGoogleSocialProviders({ clientId: " ", clientSecret: " " }),
      {},
    );
  });

  test("rejects either mismatched credential configuration", () => {
    assert.throws(
      () => getGoogleSocialProviders({ clientId: "test-client-id" }),
      /must be configured together/,
    );
    assert.throws(
      () =>
        getGoogleSocialProviders({ clientSecret: "test-client-secret" }),
      /must be configured together/,
    );
  });
});
