import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth-server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the Convex and Better Auth example application.",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await isAuthenticated()) {
    redirect("/");
  }

  return (
    <LoginForm
      googleAuthEnabled={
        process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"
      }
    />
  );
}
