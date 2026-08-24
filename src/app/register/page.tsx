import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth-server";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create an account in the Convex and Better Auth example application.",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  if (await isAuthenticated()) {
    redirect("/");
  }

  return (
    <RegisterForm
      googleAuthEnabled={
        process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"
      }
    />
  );
}
