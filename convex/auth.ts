import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { betterAuth } from "better-auth/minimal";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { createAuthOptions } from "./auth-options";
import { sendResendEmail } from "./email";

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

const resendApiKey = process.env.RESEND_API_KEY?.trim();
const emailFrom = process.env.EMAIL_FROM?.trim();

if (!resendApiKey) {
  throw new Error(
    "RESEND_API_KEY is required in the Convex deployment environment",
  );
}

if (!emailFrom) {
  throw new Error("EMAIL_FROM is required in the Convex deployment environment");
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
  return betterAuth(
    createAuthOptions({
      baseURL: siteUrl,
      secret,
      database: authComponent.adapter(ctx),
      socialProviders,
      sendEmail: async ({ to, subject, text }) => {
        await sendResendEmail({
          apiKey: resendApiKey,
          from: emailFrom,
          to,
          subject,
          text,
        });
      },
    }),
  );
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return (await authComponent.safeGetAuthUser(ctx)) ?? null;
  },
});
