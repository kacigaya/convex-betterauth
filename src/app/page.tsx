"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { LoaderOne } from "@/components/ui/loader";
import { BottomGradient } from "@/components/ui/gradient";
import DarkModeToggle from "@/components/darkmode-toggle";
import SignInButton from "@/components/buttons/signin-b";
import CreateAccountButton from "@/components/buttons/register-b";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const user = useQuery(api.auth.getCurrentUser, isAuthenticated === true ? {} : "skip");
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        setIsAuthenticated(!!session.data);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await authClient.signOut();
    setIsAuthenticated(false);
    router.push("/login");
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center px-4">
        <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
          <div className="flex flex-col items-center justify-center space-y-4">
            <LoaderOne />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center px-4">
        <div className="shadow-input mx-auto w-full max-w-xl rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
          <div className="flex justify-center">
            <DarkModeToggle />
          </div>
          <div className="flex justify-center mt-4">
            <Image src="/convex.ico" alt="Convex logo" width={100} height={100} />
            <Image
              src="/betterauth-black.png"
              alt="BetterAuth logo"
              width={100}
              height={100}
              className="dark:hidden"
            />
            <Image
              src="/betterauth-white.png"
              alt="BetterAuth logo"
              width={100}
              height={100}
              className="hidden dark:block"
            />
          </div>
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 text-center mt-4">Convex + BetterAuth</h2>
          <p className="mt-2 max-w-xl text-sm text-neutral-600 dark:text-neutral-300 text-center">
            Open Source Authentication for your Next.js app by <Link href="https://github.com/gayakaci20" className="text-neutral-600 dark:text-neutral-300 font-bold">Gaya KACI</Link>
          </p>
          <BottomGradient />
          <div className="my-8 grid grid-cols-1 gap-3">
            <SignInButton onClick={() => router.push("/login")} />
            <CreateAccountButton onClick={() => router.push("/register")} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-black/80 backdrop-blur shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Welcome back, {user.name || user.email}!</h1>
                <p className="mt-1 text-slate-600 dark:text-slate-400">You are authenticated with Convex + BetterAuth</p>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-600/50"
              >
                Sign out
              </button>
            </div>

            <div className="mt-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black p-4">
              <h2 className="text-base font-medium text-slate-900 dark:text-slate-100">User information</h2>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">User ID</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100 break-words font-mono">{user._id}</dd>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{user.email}</dd>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{user.name || "Not set"}</dd>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Created</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {user._creationTime ? new Date(user._creationTime).toLocaleDateString() : "Unknown"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
