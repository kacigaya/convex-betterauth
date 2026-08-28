"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLogo } from "@/components/auth-logo";
import { PasswordField } from "@/components/input/password-field";
import SocialAuth, {
  type SocialProvider,
} from "@/components/social-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
        setError(
          result.error.code === "EMAIL_NOT_VERIFIED"
            ? "Verify your email before signing in. Check your inbox for a verification link."
            : "Invalid email or password.",
        );
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
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <AuthLogo />
          <CardTitle className="mt-4 text-balance" render={<h1 />}>
            Welcome back
          </CardTitle>
          <CardDescription className="text-pretty">
            Sign in to your account to continue.{" "}
            <Link
              className="text-foreground underline underline-offset-4"
              href="/register"
            >
              Create one
            </Link>
          </CardDescription>
        </CardHeader>

        <CardPanel className="flex flex-col gap-4">
          {error ? (
            <Alert variant="error">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form
            aria-busy={isSubmitting}
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
            <Field>
              <FieldLabel>Email address</FieldLabel>
              <Input
                autoComplete="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </Field>

            <PasswordField
              autoComplete="current-password"
              label="Password"
              maxLength={128}
              minLength={8}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              value={password}
            />

            <Link
              className="self-end text-foreground text-sm underline underline-offset-4"
              href="/forgot-password"
            >
              Forgot password?
            </Link>

            <Button className="w-full" loading={isSubmitting} type="submit">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {googleAuthEnabled ? (
            <>
              <div className="flex items-center gap-3 text-muted-foreground text-xs">
                <Separator className="flex-1" />
                <span>or</span>
                <Separator className="flex-1" />
              </div>
              <SocialAuth
                loadingProvider={loadingProvider}
                mode="login"
                onClick={handleSocialSignIn}
              />
            </>
          ) : null}
        </CardPanel>

        <CardFooter>
          <Button
            className="w-full"
            render={<Link href="/">Back to home</Link>}
            variant="outline"
          />
        </CardFooter>
      </Card>
    </main>
  );
}
