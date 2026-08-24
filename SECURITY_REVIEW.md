# Security notes

Last reviewed: 2026-08-24

This document describes the current security boundary. It is not a substitute for a deployment-specific threat model.

## Implemented controls

- Better Auth runs in Convex and stores auth data through the official Convex adapter.
- `BETTER_AUTH_SECRET` and `SITE_URL` are required at Convex module startup.
- `SITE_URL` is the only trusted browser origin.
- Google OAuth is disabled unless both provider credentials exist.
- Better Auth uses database-backed rate limiting. Its stricter built-in sign-in rule remains active.
- Email sign-in errors are generic to reduce account enumeration.
- Password length and complexity are enforced in both the UI and a Better Auth `before` hook.
- Registration names are trimmed and capped at 80 characters on the server.
- Authenticated server rendering obtains a short-lived token through the official Next.js integration.
- Convex resolves the current user from the authenticated request. The client does not supply a user ID.
- Auth pages redirect existing sessions on the server.
- Authentication secrets are documented as Convex deployment variables, not public Next.js variables.

## Authorization boundary

`/` is a public landing page. Anonymous users can load it, while authenticated users see their account summary. This means a Next.js proxy is not required for the existing routes.

Convex handlers are the authorization boundary for application data. Every future query, mutation, or action that reads private data must derive identity from `ctx.auth` or the Better Auth component and reject unauthenticated or unauthorized callers. Hiding controls, redirecting in Next.js, and accepting client-provided ownership fields are insufficient.

## Known limitation

Email verification and password-reset delivery are unavailable because no outbound email service is configured. Until that is added:

- A registered email address does not prove ownership.
- The product must not grant privileges solely because an address uses a trusted domain.
- Users cannot complete an email-based password reset flow.

To close this gap, configure a production email provider, implement Better Auth verification and reset callbacks, enable `requireEmailVerification`, and add deterministic tests around token expiry and callback behavior. Credentials alone are not enough; delivery failures and replay handling need verification too.

## Deployment checklist

- Generate a unique `BETTER_AUTH_SECRET` for each environment.
- Set production `SITE_URL` to the exact HTTPS application origin.
- Keep Google client secrets only in the Convex deployment environment.
- Register the exact Convex `.site` OAuth callback URL with Google.
- Keep Convex and Better Auth packages on compatible versions.
- Run lint, type checking, tests, a production build, and a dependency vulnerability scan.
- Exercise registration, sign-in, sign-out, session expiry, and OAuth on the deployed origin.
- Add server-side authorization before introducing any private application data.
