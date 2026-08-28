# Security notes

Last reviewed: 2026-08-28

This document describes the current security boundary. It is not a substitute for a deployment-specific threat model.

## Implemented controls

- Better Auth runs in Convex and stores auth data through the official Convex adapter.
- `BETTER_AUTH_SECRET` and `SITE_URL` are required at Convex module startup.
- `RESEND_API_KEY` and `EMAIL_FROM` are required at Convex module startup. Auth emails have no console fallback.
- `SITE_URL` is the only trusted browser origin.
- Google OAuth is disabled unless both provider credentials exist.
- Better Auth uses database-backed rate limiting. Its stricter built-in sign-in rule remains active.
- Email/password registration requires ownership verification. Verification links expire after one hour and do not sign users in automatically.
- Unknown-account and invalid-password sign-in errors remain identical. An unverified account receives a specific instruction to check its inbox.
- Password-reset requests use the same generic response whether an account exists or email delivery succeeds.
- Reset links expire after one hour, are consumed once, and revoke all user sessions after a successful password change.
- Password length and complexity are enforced in both the UI and Better Auth `before` hooks for registration and reset.
- Registration names are trimmed and capped at 80 characters on the server.
- Authenticated server rendering obtains a short-lived token through the official Next.js integration.
- Convex resolves the current user from the authenticated request. The client does not supply a user ID.
- Auth pages redirect existing sessions on the server.
- Authentication secrets are documented as Convex deployment variables, not public Next.js variables.

## Authorization boundary

`/` is a public landing page. Anonymous users can load it, while authenticated users see their account summary. This means a Next.js proxy is not required for the existing routes.

Convex handlers are the authorization boundary for application data. Every future query, mutation, or action that reads private data must derive identity from `ctx.auth` or the Better Auth component and reject unauthenticated or unauthorized callers. Hiding controls, redirecting in Next.js, and accepting client-provided ownership fields are insufficient.

## Operational limitations

- Enabling required verification does not retroactively revoke sessions created before the setting was deployed. Revoke pre-existing sessions separately when upgrading a deployment with active users.
- Automated tests use an in-memory adapter and a fake email transport. They cover token expiry, replay, callback validation, password changes, session revocation, and delivery failures without contacting Resend.
- Production email delivery, sender-domain configuration, and callback routing still require verification with the deployment's real Convex and Resend credentials.
- Google OAuth requires a separate production check when enabled. Unit tests must not depend on real Google credentials.

## Deployment checklist

- Generate a unique `BETTER_AUTH_SECRET` for each environment.
- Set production `SITE_URL` to the exact HTTPS application origin.
- Keep `RESEND_API_KEY` and `EMAIL_FROM` only in the Convex deployment environment.
- Use a verified Resend sender or domain in production. Reserve `onboarding@resend.dev` for local tests sent to the Resend account address.
- Keep Google client secrets only in the Convex deployment environment.
- Register the exact Convex `.site` OAuth callback URL with Google.
- Keep Convex and Better Auth packages on compatible versions.
- Run lint, type checking, tests, a production build, and a dependency vulnerability scan.
- Exercise registration, verification, sign-in, sign-out, session expiry, reset expiry and replay, delivery failure, and any enabled OAuth flow on the deployed origin.
- Add server-side authorization before introducing any private application data.
