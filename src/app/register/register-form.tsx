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
import { getPasswordIssues } from "@/lib/password-strength";

export function RegisterForm({
  googleAuthEnabled,
}: {
  googleAuthEnabled: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProvider, setLoadingProvider] =
    useState<SocialProvider | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const finishRegistration = () => {
    router.replace("/");
    router.refresh();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter your name.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const passwordIssues = getPasswordIssues(password);
    if (passwordIssues.length > 0) {
      setError(`Password requirements not met: ${passwordIssues.join(", ")}.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authClient.signUp.email({
        name: trimmedName,
        email: email.trim(),
        password,
      });

      if (result.error) {
        setError(
          "Could not create the account. Check your details or try signing in.",
        );
        return;
      }

      finishRegistration();
    } catch {
      setError("Could not create the account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSignUp = async (provider: SocialProvider) => {
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
          <CardTitle className="mt-4">Create your account</CardTitle>
          <CardDescription>
            Add your details to get started.{" "}
            <Link
              className="text-foreground underline underline-offset-4"
              href="/login"
            >
              Sign in instead
            </Link>
          </CardDescription>
        </CardHeader>

        <CardPanel className="flex flex-col gap-4">
          {error ? (
            <Alert variant="error">
              <AlertDescription className="whitespace-pre-line">
                {error}
              </AlertDescription>
            </Alert>
          ) : null}

          <form
            aria-busy={isSubmitting}
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                autoComplete="name"
                maxLength={80}
                name="name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                required
                type="text"
                value={name}
              />
            </Field>

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
              autoComplete="new-password"
              label="Password"
              maxLength={128}
              minLength={8}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              showRequirements
              value={password}
            />

            <PasswordField
              autoComplete="new-password"
              label="Confirm password"
              matchValue={password}
              maxLength={128}
              minLength={8}
              name="passwordConfirmation"
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              value={confirmPassword}
            />

            <Button className="w-full" loading={isSubmitting} type="submit">
              {isSubmitting ? "Creating account..." : "Create account"}
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
                mode="register"
                onClick={handleSocialSignUp}
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
