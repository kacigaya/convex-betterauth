"use client";

import { useState } from "react";
import { usePreloadedAuthQuery } from "@convex-dev/better-auth/nextjs/client";
import type { Preloaded } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { api } from "../../convex/_generated/api";
import { AuthLogo } from "@/components/auth-logo";
import DarkModeToggle from "@/components/darkmode-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function HomeContent({
  preloadedUser,
}: {
  preloadedUser: Preloaded<typeof api.auth.getCurrentUser>;
}) {
  const user = usePreloadedAuthQuery(preloadedUser);
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  const handleLogout = async () => {
    setIsSigningOut(true);
    setSignOutError("");

    try {
      const result = await authClient.signOut();
      if (result.error) {
        setSignOutError("Could not sign out. Please try again.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setSignOutError("Could not sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!user) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="flex justify-center">
              <DarkModeToggle />
            </div>
            <AuthLogo />
            <CardTitle className="mt-4 text-center">
              Convex + Better Auth
            </CardTitle>
            <CardDescription className="text-center">
              Open source authentication for Next.js by{" "}
              <Link
                className="text-foreground underline underline-offset-4"
                href="https://github.com/gayakaci20"
              >
                Gaya KACI
              </Link>
            </CardDescription>
          </CardHeader>
          <CardPanel className="flex flex-col gap-2">
            <Button className="w-full" render={<Link href="/login">Sign in</Link>} />
            <Button
              className="w-full"
              render={<Link href="/register">Create account</Link>}
              variant="outline"
            />
          </CardPanel>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-balance font-semibold text-2xl">
              Welcome back, {user.name || user.email}
            </h1>
            <p className="text-pretty text-muted-foreground text-sm">
              You are authenticated with Convex + Better Auth.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <Button
              loading={isSigningOut}
              onClick={handleLogout}
              variant="destructive-outline"
            >
              Sign out
            </Button>
          </div>
        </div>

        {signOutError ? (
          <Alert variant="error">
            <AlertDescription>{signOutError}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>User information</CardTitle>
            <CardDescription>
              Session details returned by the Convex query.
            </CardDescription>
          </CardHeader>
          <CardPanel>
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
              <UserDetail label="User ID" mono value={user._id} />
              <UserDetail label="Email" value={user.email} />
              <UserDetail label="Name" value={user.name || "Not set"} />
              <UserDetail
                label="Created"
                value={dateFormatter.format(user._creationTime)}
              />
            </dl>
          </CardPanel>
        </Card>
      </div>
    </main>
  );
}

function UserDetail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 bg-card p-4">
      <dt className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </dt>
      <dd className={cn("break-words text-sm", mono && "font-mono")}>
        {value}
      </dd>
    </div>
  );
}
