import { convex } from "@convex-dev/better-auth/plugins";
import type { BetterAuthOptions } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import authConfig from "./auth.config";
import { getPasswordIssues } from "../src/lib/password-strength";

export type AuthEmailMessage = {
  to: string;
  subject: string;
  text: string;
};

type CreateAuthOptionsArgs = {
  baseURL: string;
  secret: string;
  database: BetterAuthOptions["database"];
  socialProviders: BetterAuthOptions["socialProviders"];
  sendEmail: (message: AuthEmailMessage) => Promise<void>;
  emailVerificationExpiresIn?: number;
  resetPasswordTokenExpiresIn?: number;
};

export function createAuthOptions({
  baseURL,
  secret,
  database,
  socialProviders,
  sendEmail,
  emailVerificationExpiresIn = 3600,
  resetPasswordTokenExpiresIn = 3600,
}: CreateAuthOptionsArgs) {
  return {
    baseURL,
    secret,
    trustedOrigins: [baseURL],
    database,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      sendResetPassword: async ({
        user,
        url,
      }: {
        user: { email: string };
        url: string;
      }) => {
        await sendEmail({
          to: user.email,
          subject: "Reset your password",
          text: [
            "Reset your password for Convex + Better Auth:",
            "",
            url,
            "",
            "This link expires in 1 hour. If you did not request a password reset, ignore this email.",
          ].join("\n"),
        });
      },
      resetPasswordTokenExpiresIn,
      revokeSessionsOnPasswordReset: true,
    },
    emailVerification: {
      sendVerificationEmail: async ({
        user,
        url,
      }: {
        user: { email: string };
        url: string;
      }) => {
        await sendEmail({
          to: user.email,
          subject: "Verify your email address",
          text: [
            "Verify your email address for Convex + Better Auth:",
            "",
            url,
            "",
            "This link expires in 1 hour. If you did not create this account, ignore this email.",
          ].join("\n"),
        });
      },
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: false,
      expiresIn: emailVerificationExpiresIn,
    },
    socialProviders,
    rateLimit: {
      storage: "database" as const,
    },
    hooks: {
      before: createAuthMiddleware(async (request) => {
        if (request.path === "/reset-password") {
          const newPassword = request.body?.newPassword;

          if (typeof newPassword !== "string") {
            throw new APIError("BAD_REQUEST", {
              message: "Password is required",
            });
          }

          const passwordIssues = getPasswordIssues(newPassword);
          if (passwordIssues.length > 0) {
            throw new APIError("BAD_REQUEST", {
              message: passwordIssues.join(". "),
            });
          }

          return;
        }

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
  } satisfies BetterAuthOptions;
}
