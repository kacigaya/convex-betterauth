# Security Review: Convex + Better Auth Implementation

**Date:** 2026-02-15
**Scope:** Full authentication implementation review against [Better Auth Convex Integration docs](https://www.better-auth.com/docs/integrations/convex) and [Convex + Better Auth Next.js guide](https://labs.convex.dev/better-auth/framework-guides/next)

---

## 1. Security Vulnerabilities & Misconfigurations

### CRITICAL: Email Verification Disabled

**File:** `convex/auth.ts:25`

```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: false, // <-- CRITICAL
},
```

**Risk:** Any attacker can register accounts with arbitrary email addresses they do not own, enabling:
- Account impersonation (registering as `admin@yourcompany.com`)
- Spam and abuse at scale
- Credential-based phishing attacks using real-looking accounts

**Fix:**
```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
},
```
You will need to configure an email transport (the project already has `nodemailer` installed) so that verification emails can be sent.

---

### CRITICAL: No Server-Side Route Protection (Missing Middleware)

**Missing file:** `middleware.ts` (does not exist)
**Missing file:** `src/lib/auth-server.ts` (does not exist)

The application has **zero server-side route protection**. All "protection" is purely client-side via `useState` checks in `src/app/page.tsx:21-31`:

```typescript
useEffect(() => {
  const checkAuth = async () => {
    const session = await authClient.getSession();
    setIsAuthenticated(!!session.data);
  };
  checkAuth();
}, []);
```

**Risk:** Client-side auth checks are trivially bypassable. Any user can:
- Access protected pages by manipulating JavaScript state
- Read page source/HTML before the auth check runs
- Disable JavaScript and see raw page content

**Fix:** Create `middleware.ts` at the project root:
```typescript
import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/"];
const authRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("better-auth.session_token")?.value;
  const { pathname } = request.nextUrl;

  if (protectedRoutes.includes(pathname) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (authRoutes.includes(pathname) && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register"],
};
```

Additionally, create `src/lib/auth-server.ts` as recommended by the [Convex + Better Auth Next.js guide](https://labs.convex.dev/better-auth/framework-guides/next):
```typescript
import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

export const {
  handler,
  preloadAuthQuery,
  isAuthenticated,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthNextJs({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
});
```

Then use `isAuthenticated()` in server components and `preloadAuthQuery` for SSR.

---

### HIGH: Better Auth Version Not Pinned (Potential Compatibility & Security Issues)

**File:** `package.json:15`

```json
"better-auth": "^1.4.18",
```

**Risk:** The Convex Better Auth component [documentation explicitly requires](https://labs.convex.dev/better-auth) installing `better-auth@1.4.9` with `--save-exact`. Using an unpinned caret range (`^1.4.18`) means:
- Automatic minor/patch updates may break compatibility with `@convex-dev/better-auth`
- Known module resolution errors exist with certain version combinations (e.g., passkey plugin import failures)
- There are [open issues](https://github.com/get-convex/better-auth/issues/235) with version mismatches causing adapter errors

**Fix:**
```bash
npm install better-auth@1.4.9 --save-exact
```

---

### HIGH: No `trustedOrigins` Configuration

**File:** `convex/auth.ts`

The `betterAuth()` configuration does not specify `trustedOrigins`. While Better Auth defaults to trusting the `baseURL`, in production with proxies, CDNs, or multiple domains, this can lead to:
- CSRF protection failures if the origin header doesn't match the base URL exactly
- Open redirect vulnerabilities if callbacks aren't constrained

**Fix:**
```typescript
return betterAuth({
  baseURL: siteUrl,
  trustedOrigins: [siteUrl],
  // ... rest of config
});
```

---

### HIGH: No Rate Limiting Configuration

**File:** `convex/auth.ts`

No rate limiting is configured. Better Auth's built-in rate limiting is disabled in development by default, and no explicit production configuration exists.

**Risk:** Without rate limiting, the following are possible:
- Brute-force password attacks on `/sign-in/email`
- Account enumeration via registration endpoint
- Credential stuffing at scale

**Fix:**
```typescript
return betterAuth({
  // ... existing config
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 10, max: 3 },
      "/sign-up/email": { window: 60, max: 5 },
      "/forgot-password": { window: 60, max: 3 },
    },
  },
});
```

---

### MEDIUM: Auth Client `baseURL` Logic Has Fallback Mismatch

**File:** `src/lib/auth-client.ts:5`

```typescript
baseURL: typeof window !== "undefined"
  ? `${window.location.origin}/api/auth`
  : process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
```

**Risk:**
- The client-side branch appends `/api/auth` to the origin, but the server-side fallback uses the raw Convex site URL (no `/api/auth` suffix). This inconsistency could cause SSR vs. client-side auth requests to go to different endpoints.
- Using `window.location.origin` means the base URL is whatever domain the user is currently on. If the app is loaded on an unexpected origin (e.g., via an iframe, a proxy, or a preview deployment), auth requests could be misdirected.

**Fix:** Use an explicit environment variable:
```typescript
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth`
    : process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
  plugins: [convexClient()],
});
```

---

### MEDIUM: Social Auth Error Handling Missing

**File:** `src/app/login/page.tsx:47-51`, `src/components/social-auth.tsx`

```typescript
const handleSocialSignIn = async (provider: string) => {
  await authClient.signIn.social({
    provider,
  });
};
```

**Risk:** No error handling around social sign-in. If the OAuth flow fails (e.g., user denies consent, provider is down, or configuration is wrong), the error is silently swallowed. Users get no feedback.

**Fix:**
```typescript
const handleSocialSignIn = async (provider: string) => {
  try {
    const result = await authClient.signIn.social({ provider });
    if (result?.error) {
      setError(`Sign-in with ${provider} failed: ${result.error.message}`);
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : "Social sign-in failed");
  }
};
```

---

### MEDIUM: Error Messages May Leak Information

**File:** `src/app/login/page.tsx:34`

```typescript
if (result.error) {
  setError(result.error.message || "Login failed");
}
```

**Risk:** Better Auth's default error messages may reveal whether an email exists in the system (e.g., "User not found" vs. "Invalid password"), enabling account enumeration.

**Fix:** Use a generic error message:
```typescript
setError("Invalid email or password");
```

---

### MEDIUM: `console.error` Exposes Error Details in Production

**File:** `src/app/login/page.tsx:40`

```typescript
console.error("Login error:", err);
```

**Risk:** In production, this logs potentially sensitive error details (stack traces, internal server messages) to the browser console, which can be read by anyone with DevTools.

**Fix:** Remove or guard with environment check:
```typescript
if (process.env.NODE_ENV === "development") {
  console.error("Login error:", err);
}
```

---

### LOW: No Session Expiration or Cookie Cache Configuration

**File:** `convex/auth.ts`

No explicit session configuration means Better Auth defaults apply (7-day expiry, 1-day update age). These may or may not be appropriate for your use case, but should be an explicit decision.

**Fix:**
```typescript
return betterAuth({
  // ... existing config
  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 days - make this explicit
    updateAge: 60 * 60 * 24,       // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,              // 5 minutes
    },
  },
});
```

---

## 2. Authentication Completeness

### Missing: `auth-server.ts` Server Helper Module

The [Convex + Better Auth Next.js guide](https://labs.convex.dev/better-auth/framework-guides/next) recommends creating `lib/auth-server.ts` that exports `handler`, `preloadAuthQuery`, `isAuthenticated`, `getToken`, `fetchAuthQuery`, `fetchAuthMutation`, and `fetchAuthAction`. This file is entirely missing.

**Impact:** Without this, you cannot:
- Check authentication status in Server Components
- Preload authenticated queries for SSR
- Make authenticated Convex calls from server-side code
- Properly protect server-rendered routes

The current API route at `src/app/api/auth/[...all]/route.ts` creates its own `convexBetterAuthNextJs` instance rather than importing from a shared module, violating the DRY principle and making the handler configuration harder to keep consistent.

---

### Missing: OAuth Provider Configurations (GitHub, Facebook, X/Twitter)

**File:** `convex/auth.ts:27-31`

Only Google is configured as a social provider:

```typescript
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  },
},
```

However, `src/components/social-auth.tsx` renders buttons for **Google, X/Twitter, Facebook, and GitHub**. Clicking any provider besides Google will fail silently or error.

**Fix:** Either:
1. Add configuration for all providers:
```typescript
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID as string,
    clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
  },
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID as string,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID as string,
    clientSecret: process.env.TWITTER_CLIENT_SECRET as string,
  },
},
```
2. Or remove the unconfigured provider buttons from the UI to avoid user confusion.

---

### Missing: Password Reset / Forgot Password Flow

There is no "Forgot password" link, page, or handler anywhere in the application. Users who lose their passwords have no recovery path.

**Fix:** Add a forgot-password page and configure Better Auth's password reset functionality.

---

### Missing: Email Verification Flow

Even if `requireEmailVerification` were enabled, there is no:
- Email transport configuration (SMTP/nodemailer setup in Better Auth config)
- Verification success/failure pages
- Resend verification email UI

`nodemailer` is installed as a dependency but not wired up.

---

### Missing: Account Linking / Management

No UI or flow exists for:
- Linking multiple OAuth providers to the same account
- Unlinking providers
- Changing email or password after registration

---

### Missing: Sign-Out Session Invalidation Confirmation

**File:** `src/app/page.tsx:33-37`

```typescript
const handleLogout = async () => {
  await authClient.signOut();
  setIsAuthenticated(false);
  router.push("/login");
};
```

The sign-out function doesn't handle errors. If the session invalidation request fails, the user is still redirected to `/login` with stale session state.

---

## 3. Best Practices Recommendations

### 3.1 Create a Centralized `auth-server.ts`

Consolidate all server-side auth utilities into `src/lib/auth-server.ts` per the official documentation. Update `src/app/api/auth/[...all]/route.ts` to import from this shared module:

```typescript
// src/app/api/auth/[...all]/route.ts
import { handler } from "@/lib/auth-server";
export const { GET, POST } = handler;
```

---

### 3.2 Use Server Components for Protected Pages

Convert protected pages to use Server Components with `isAuthenticated()` checks:

```typescript
// src/app/page.tsx (server component)
import { isAuthenticated, preloadAuthQuery } from "@/lib/auth-server";
import { api } from "../../convex/_generated/api";
import Dashboard from "./dashboard"; // client component

export default async function Home() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  const preloaded = await preloadAuthQuery(api.auth.getCurrentUser);
  return <Dashboard preloaded={preloaded} />;
}
```

---

### 3.3 Add `.env.example` Template

Create a `.env.example` file to document required environment variables without exposing secrets:

```env
# Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=

# Better Auth (set via Convex CLI: npx convex env set)
# BETTER_AUTH_SECRET=  (set on Convex dashboard)
# SITE_URL=            (set on Convex dashboard)

# OAuth Providers (set via Convex CLI)
# GOOGLE_CLIENT_ID=    (set on Convex dashboard)
# GOOGLE_CLIENT_SECRET=(set on Convex dashboard)
```

---

### 3.4 Pin All Security-Critical Dependencies

```json
{
  "better-auth": "1.4.9",
  "@convex-dev/better-auth": "0.10.10",
  "convex": "1.31.7"
}
```

Use exact versions (`--save-exact`) for auth-related packages to prevent unexpected breaking changes.

---

### 3.5 Add Input Sanitization

The registration page uses the email prefix as the user's name:

```typescript
name: email.split("@")[0],  // src/app/register/page.tsx:55
```

While Better Auth should handle this safely, it's better to provide a proper name field in the registration form or at minimum sanitize the derived name.

---

### 3.6 Implement Proper Loading States for Social Auth

Social auth buttons have no loading/disabled state during the OAuth redirect. Users may click multiple times, triggering multiple OAuth flows.

**Fix:** Add loading state per provider:
```typescript
const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

const handleSocialSignIn = async (provider: string) => {
  setLoadingProvider(provider);
  try {
    await authClient.signIn.social({ provider });
  } catch (err) {
    setError("Social sign-in failed");
  } finally {
    setLoadingProvider(null);
  }
};
```

---

### 3.7 Configure `advanced` Security Options for Production

```typescript
return betterAuth({
  // ... existing config
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  },
});
```

---

### 3.8 Add CORS Headers to Convex HTTP Router

If the Next.js app and Convex deployment are on different origins (they are -- `.convex.cloud` vs your app domain), ensure proper CORS configuration in `convex/http.ts`.

---

## Summary of Findings

| # | Severity | Issue | File |
|---|----------|-------|------|
| 1 | CRITICAL | Email verification disabled | `convex/auth.ts:25` |
| 2 | CRITICAL | No server-side route protection / no middleware | Missing `middleware.ts` |
| 3 | HIGH | Better Auth version not pinned (`^1.4.18` vs required `1.4.9`) | `package.json:15` |
| 4 | HIGH | No `trustedOrigins` configuration | `convex/auth.ts` |
| 5 | HIGH | No rate limiting configured | `convex/auth.ts` |
| 6 | MEDIUM | Auth client `baseURL` inconsistency (client vs SSR) | `src/lib/auth-client.ts:5` |
| 7 | MEDIUM | Social auth has no error handling | `src/app/login/page.tsx:47` |
| 8 | MEDIUM | Error messages may enable account enumeration | `src/app/login/page.tsx:34` |
| 9 | MEDIUM | `console.error` in production | `src/app/login/page.tsx:40` |
| 10 | LOW | No explicit session/cookie configuration | `convex/auth.ts` |
| 11 | MISSING | `auth-server.ts` server helper (docs requirement) | Missing file |
| 12 | MISSING | OAuth providers configured in UI but not backend | `social-auth.tsx` vs `auth.ts` |
| 13 | MISSING | Password reset flow | Not implemented |
| 14 | MISSING | Email verification flow | Not implemented |
| 15 | MISSING | `.env.example` file | Not present |

---

## References

- [Better Auth - Convex Integration](https://www.better-auth.com/docs/integrations/convex)
- [Convex + Better Auth - Next.js Guide](https://labs.convex.dev/better-auth/framework-guides/next)
- [Better Auth - Security Reference](https://www.better-auth.com/docs/reference/security)
- [Better Auth - Session Management](https://www.better-auth.com/docs/concepts/session-management)
- [Better Auth - Rate Limiting](https://www.better-auth.com/docs/concepts/rate-limit)
- [Better Auth - Cookie Configuration](https://www.better-auth.com/docs/concepts/cookies)
- [Convex - Authorization Best Practices](https://stack.convex.dev/authorization)
- [GitHub - get-convex/better-auth](https://github.com/get-convex/better-auth)
