import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { betterAuth } from "better-auth/minimal";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import { getPasswordIssues } from "../src/lib/password-strength";

const siteUrl = process.env.SITE_URL;
const secret = process.env.BETTER_AUTH_SECRET;

if (!siteUrl) {
  throw new Error("SITE_URL is required in the Convex deployment environment");
}

if (!secret) {
  throw new Error(
    "BETTER_AUTH_SECRET is required in the Convex deployment environment",
  );
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (Boolean(googleClientId) !== Boolean(googleClientSecret)) {
  throw new Error(
    "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured together",
  );
}

const socialProviders =
  googleClientId && googleClientSecret
    ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
    : {};

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    secret,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: false,
    },
    socialProviders,
    rateLimit: {
      storage: "database",
    },
    hooks: {
      before: createAuthMiddleware(async (request) => {
        if (request.path !== "/sign-up/email") {
          return;
        }

        const password = request.body?.password;
        const name = request.body?.name;

        if (typeof password !== "string") {
          throw new APIError("BAD_REQUEST", { message: "Password is required" });
        }

        const passwordIssues = getPasswordIssues(password);
        if (passwordIssues.length > 0) {
          throw new APIError("BAD_REQUEST", {
            message: passwordIssues.join(". "),
          });
        }

        if (typeof name !== "string" || name.trim().length === 0) {
          throw new APIError("BAD_REQUEST", { message: "Name is required" });
        }

        if (name.trim().length > 80) {
          throw new APIError("BAD_REQUEST", {
            message: "Name must be 80 characters or fewer",
          });
        }

        return {
          context: {
            ...request,
            body: {
              ...request.body,
              name: name.trim(),
            },
          },
        };
      }),
    },
    plugins: [convex({ authConfig })],
  });
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return (await authComponent.safeGetAuthUser(ctx)) ?? null;
  },
});
