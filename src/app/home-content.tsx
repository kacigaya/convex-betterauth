"use client";

import { useState } from "react";
import { usePreloadedAuthQuery } from "@convex-dev/better-auth/nextjs/client";
import type { Preloaded } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { api } from "../../convex/_generated/api";
import { AuthLogo } from "@/components/auth-logo";
import DarkModeToggle from "@/components/darkmode-toggle";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

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
      <main className="flex min-h-dvh items-center justify-center bg-white px-4 dark:bg-black">
        <section className="mx-auto w-full max-w-xl rounded-none bg-white p-4 shadow-input md:rounded-2xl md:p-8 dark:bg-black">
          <div className="flex justify-center">
            <DarkModeToggle />
          </div>
          <div className="mt-4">
            <AuthLogo />
          </div>
          <h1 className="mt-4 text-balance text-center text-2xl font-bold text-neutral-800 dark:text-neutral-200">
            Convex + Better Auth
          </h1>
          <p className="mt-2 max-w-xl text-pretty text-center text-sm text-neutral-600 dark:text-neutral-300">
            Open source authentication for Next.js by{" "}
            <Link
              href="https://github.com/gayakaci20"
              className="font-bold text-neutral-700 underline-offset-4 hover:underline dark:text-neutral-200"
            >
              Gaya KACI
            </Link>
          </p>
          <div className="my-8 grid grid-cols-1 gap-3">
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-white dark:bg-black">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm dark:border-slate-700 dark:bg-black/80">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-balance text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  Welcome back, {user.name || user.email}!
                </h1>
                <p className="mt-1 text-pretty text-slate-600 dark:text-slate-400">
                  You are authenticated with Convex + Better Auth.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={handleLogout}
                disabled={isSigningOut}
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>

            {signOutError ? (
              <p
                role="alert"
                className="mt-4 text-sm text-red-700 dark:text-red-400"
              >
                {signOutError}
              </p>
            ) : null}

            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-black">
              <h2 className="text-base font-medium text-slate-900 dark:text-slate-100">
                User information
              </h2>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <UserDetail label="User ID" value={user._id} mono />
                <UserDetail label="Email" value={user.email} />
                <UserDetail label="Name" value={user.name || "Not set"} />
                <UserDetail
                  label="Created"
                  value={new Date(user._creationTime).toLocaleDateString()}
                />
              </dl>
            </div>
          </div>
        </section>
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
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <dt className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd
        className={`mt-1 break-words text-sm text-slate-900 dark:text-slate-100 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
