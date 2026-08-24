"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthLogo } from "@/components/auth-logo";
import { PasswordField } from "@/components/input/password-field";
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
import { authClient } from "@/lib/auth-client";
import { getPasswordIssues } from "@/lib/password-strength";

export function ResetPasswordForm({
  token,
  tokenError,
}: {
  token: string;
  tokenError: string;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isReset, setIsReset] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

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
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (result.error) {
        setError(
          "Could not reset the password. The link may have expired or already been used.",
        );
        return;
      }

      setIsReset(true);
    } catch {
      setError("Could not reset the password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token || tokenError) {
    return (
      <ResetPasswordCard
        description="Request a new reset link and try again."
        title="This reset link is not valid"
      >
        <CardPanel>
          <Alert variant="error">
            <AlertDescription>
              The link is missing a token, has expired, or has already been used.
            </AlertDescription>
          </Alert>
        </CardPanel>
      </ResetPasswordCard>
    );
  }

  if (isReset) {
    return (
      <ResetPasswordCard
        description="Your password has been updated."
        title="Password reset"
      >
        <CardPanel>
          <Button
            className="w-full"
            render={<Link href="/login">Sign in</Link>}
          />
        </CardPanel>
      </ResetPasswordCard>
    );
  }

  return (
    <ResetPasswordCard
      description="Choose a new password for your account."
      title="Set a new password"
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
          <PasswordField
            autoComplete="new-password"
            label="New password"
            maxLength={128}
            minLength={8}
            name="newPassword"
            onChange={(event) => setPassword(event.target.value)}
            required
            showRequirements
            value={password}
          />

          <PasswordField
            autoComplete="new-password"
            label="Confirm new password"
            matchValue={password}
            maxLength={128}
            minLength={8}
            name="newPasswordConfirmation"
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            value={confirmPassword}
          />

          <Button className="w-full" loading={isSubmitting} type="submit">
            {isSubmitting ? "Resetting password..." : "Reset password"}
          </Button>
        </form>
      </CardPanel>
    </ResetPasswordCard>
  );
}

function ResetPasswordCard({
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
          <CardTitle className="mt-4">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        {children}

        <CardFooter>
          <Button
            className="w-full"
            render={<Link href="/login">Back to sign in</Link>}
            variant="outline"
          />
        </CardFooter>
      </Card>
    </main>
  );
}
