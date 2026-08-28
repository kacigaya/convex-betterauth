import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Email verification",
  description: "Email verification result for your account.",
  robots: { index: false, follow: false },
};

const failureMessages = {
  INVALID_TOKEN:
    "This verification link is invalid. Sign in to request a new link.",
  TOKEN_EXPIRED:
    "This verification link has expired. Sign in to request a new link.",
} as const;

type VerificationError = keyof typeof failureMessages;

function getErrorCode(error: string | string[] | undefined) {
  return typeof error === "string" ? error : undefined;
}

export default async function EmailVerifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { error } = await searchParams;
  const errorCode = getErrorCode(error);
  const isFailure = error !== undefined;
  const description = isFailure
    ? "We could not verify your email address."
    : "Your email address is verified. You can now sign in.";
  const failureMessage =
    errorCode && errorCode in failureMessages
      ? failureMessages[errorCode as VerificationError]
      : "The verification link could not be completed. Sign in to request a new link.";

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <AuthLogo />
          <CardTitle className="mt-4 text-balance" render={<h1 />}>
            {isFailure ? "Email not verified" : "Email verified"}
          </CardTitle>
          <CardDescription className="text-pretty">
            {description}
          </CardDescription>
        </CardHeader>

        {isFailure ? (
          <CardPanel>
            <Alert variant="error">
              <AlertDescription>{failureMessage}</AlertDescription>
            </Alert>
          </CardPanel>
        ) : null}

        <CardFooter className="flex-col gap-2">
          <Button
            className="w-full"
            render={<Link href="/login">Go to sign in</Link>}
          />
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
