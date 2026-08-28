import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { betterAuth } from "better-auth/minimal";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import {
  createAuthOptions,
  getGoogleSocialProviders,
} from "./auth-options";
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

const socialProviders = getGoogleSocialProviders({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
});

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
