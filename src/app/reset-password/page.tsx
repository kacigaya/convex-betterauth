import type { Metadata } from "next";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your Convex and Better Auth account.",
  robots: { index: false, follow: false },
};

// Better Auth redirects here from the emailed link with `?token=...`, or with
// `?error=INVALID_TOKEN` when the link is expired or already used. Authenticated
// visitors are not redirected away: a reset link must stay usable in a session
// that is already signed in.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return <ResetPasswordForm token={token ?? ""} tokenError={error ?? ""} />;
}
