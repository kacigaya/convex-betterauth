"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthLogo } from "@/components/auth-logo";
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
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [requestAccepted, setRequestAccepted] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: "/reset-password",
      });

      if (result.error) {
        setError("Could not request a reset link. Please try again.");
        return;
      }

      setRequestAccepted(true);
    } catch {
      setError("Could not request a reset link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requestAccepted) {
    return (
      <ForgotPasswordCard
        description="If that email matches an account, a reset link may arrive shortly."
        title="Check your inbox"
      >
        <CardPanel>
          <Alert variant="info">
            <AlertDescription>
              Reset links expire after one hour. Check your spam folder if no
              message appears.
            </AlertDescription>
          </Alert>
        </CardPanel>
      </ForgotPasswordCard>
    );
  }

  return (
    <ForgotPasswordCard
      description="Enter your email address to request a password reset link."
      title="Reset your password"
    >
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

          <Button className="w-full" loading={isSubmitting} type="submit">
            {isSubmitting ? "Requesting reset link..." : "Request reset link"}
          </Button>
        </form>
      </CardPanel>
    </ForgotPasswordCard>
  );
}

function ForgotPasswordCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <AuthLogo />
          <CardTitle className="mt-4 text-balance" render={<h1 />}>
            {title}
          </CardTitle>
          <CardDescription className="text-pretty">
            {description}
          </CardDescription>
        </CardHeader>

        {children}

        <CardFooter className="flex-col gap-2">
          <Button
            className="w-full"
            render={<Link href="/login">Back to sign in</Link>}
            variant="outline"
          />
          <Button
            className="w-full"
            render={<Link href="/">Back to home</Link>}
            variant="ghost"
          />
        </CardFooter>
      </Card>
    </main>
  );
}
