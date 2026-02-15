"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LabelInputContainer } from "@/components/ui/label-input-container";
import SocialAuth from "@/components/social-auth";
import PasswordLogin from "@/components/input/password_login";
import BackToHomeButton from "@/components/buttons/home";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Login failed");
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: string) => {
    await authClient.signIn.social({
      provider,
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
        <div className="flex justify-center mt-4 mb-4">
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
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
          Welcome back
        </h2>
        <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
          Sign in to your account to continue.{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
            Create one
          </Link>
        </p>

        {error ? (
          <div role="alert" aria-live="polite" id="form-error" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        ) : null}

        <form className="my-8" onSubmit={handleSubmit}>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? "form-error" : undefined}
              placeholder="you@example.com"
            />
          </LabelInputContainer>

          <PasswordLogin value={password} onChange={setPassword} />

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
        <SocialAuth onClick={handleSocialSignIn} mode="login" />
        <div className="my-8 grid grid-cols-1 gap-3">
          <BackToHomeButton onClick={() => router.push("/")}>
            Back to home →
          </BackToHomeButton>
        </div>
      </div>
    </div>
  );
}
