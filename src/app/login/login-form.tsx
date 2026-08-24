"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLogo } from "@/components/auth-logo";
import { PasswordField } from "@/components/input/password-field";
import SocialAuth, {
  type SocialProvider,
} from "@/components/social-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LabelInputContainer } from "@/components/ui/label-input-container";
import { authClient } from "@/lib/auth-client";

export function LoginForm({
  googleAuthEnabled,
}: {
  googleAuthEnabled: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProvider, setLoadingProvider] =
    useState<SocialProvider | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const finishSignIn = () => {
    router.replace("/");
    router.refresh();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (result.error) {
        setError("Invalid email or password.");
        return;
      }

      finishSignIn();
    } catch {
      setError("Could not sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSignIn = async (provider: SocialProvider) => {
    setLoadingProvider(provider);
    setError("");

    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });

      if (result?.error) {
        setError("Could not connect to Google. Please try again.");
      }
    } catch {
      setError("Could not connect to Google. Please try again.");
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-4 py-12 dark:bg-black">
      <section className="mx-auto w-full max-w-md rounded-none bg-white p-4 shadow-input md:rounded-2xl md:p-8 dark:bg-black">
        <AuthLogo />
        <h1 className="mt-4 text-balance text-2xl font-bold text-neutral-800 dark:text-neutral-200">
          Welcome back
        </h1>
        <p className="mt-2 max-w-sm text-pretty text-sm text-neutral-600 dark:text-neutral-300">
          Sign in to your account to continue.{" "}
          <Link
            href="/register"
            className="font-medium text-blue-700 underline-offset-4 hover:underline dark:text-blue-400"
          >
            Create one
          </Link>
        </p>

        {error ? (
          <p
            role="alert"
            id="login-error"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </p>
        ) : null}

        <form
          className="my-8 space-y-4"
          onSubmit={handleSubmit}
          aria-busy={isSubmitting}
        >
          <LabelInputContainer>
            <Label htmlFor="login-email">Email address</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-describedby={error ? "login-error" : undefined}
              placeholder="you@example.com"
            />
          </LabelInputContainer>

          <PasswordField
            id="login-password"
            label="Password"
            name="password"
            autoComplete="current-password"
            required
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby={error ? "login-error" : undefined}
          />

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {googleAuthEnabled ? (
          <>
            <div className="my-8 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>or</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <SocialAuth
              onClick={handleSocialSignIn}
              mode="login"
              loadingProvider={loadingProvider}
            />
          </>
        ) : null}

        <Button asChild variant="outline" className="mt-8 w-full">
          <Link href="/">Back to home</Link>
        </Button>
      </section>
    </main>
  );
}
