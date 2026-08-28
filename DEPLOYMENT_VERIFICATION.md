# Deployment verification

Use this runbook after deploying both Next.js and Convex. It does not contain credentials and does not record a successful production verification.

## Configuration

Set these public values in the Next.js hosting environment:

| Variable | Required | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Production Convex `.cloud` URL. |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Yes | Production Convex `.site` URL. |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | No | `true` only when both Google credentials are set on the same Convex deployment. Otherwise `false`. |

Set these private values on the production Convex deployment:

| Variable | Required | Value |
| --- | --- | --- |
| `SITE_URL` | Yes | Canonical HTTPS Next.js origin without a trailing slash. |
| `BETTER_AUTH_SECRET` | Yes | Production-only random secret with at least 32 characters. |
| `RESEND_API_KEY` | Yes | Production Resend API key. |
| `EMAIL_FROM` | Yes | Sender on a verified Resend domain. |
| `GOOGLE_CLIENT_ID` | For Google OAuth | Production Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | For Google OAuth | Matching production Google OAuth client secret. |

Keep all private Convex values out of source control, `.env.local`, logs, screenshots, and `NEXT_PUBLIC_*` variables. Configure Google credentials as a pair. Register this callback with Google when OAuth is enabled:

```text
https://your-deployment.convex.site/api/auth/callback/google
```

Configuration status: **Pending: deployment credentials/access unavailable**

## Automated smoke check

Run the smoke check with the exact public Next.js origin:

```bash
bun run verify:deployment -- https://app.example.com
```

The command accepts only a bare HTTPS origin. It sends anonymous `GET` requests without cookies or request bodies to the home, login, registration, password, callback-result, and session routes. Redirects, non-200 responses, malformed session JSON, or an authenticated anonymous session fail the command. It never registers an account, sends email, starts OAuth, or changes deployment data.

This check proves only that public routes respond and the session endpoint treats a cookieless request as anonymous. It does not verify Convex credentials, email delivery, token behavior, authenticated sessions, OAuth, or authorization between users.

Production smoke status: **Pending: deployment credentials/access unavailable**

## Manual verification matrix

Use dedicated test accounts and a mailbox controlled by the tester. Record the deployment, UTC time, result, and any sanitized error identifier for each row. Never copy passwords, tokens, cookies, API keys, or full email links into the record.

| Check | Procedure and expected result | Status |
| --- | --- | --- |
| Registration | Register a new address with a policy-compliant password. The UI shows the generic inbox prompt, the account remains signed out, and Resend delivers one verification message. | Pending: deployment credentials/access unavailable |
| Email verification | Open the new verification link once. The callback result reports success, does not sign the user in, and the account can then sign in. | Pending: deployment credentials/access unavailable |
| Unverified login | Register another account but do not open its verification link. Sign-in is rejected without creating a session or disclosing extra account state. | Pending: deployment credentials/access unavailable |
| Login | Sign in with the verified account. A session is created and the home page shows only that account's current-user details. A wrong password and an unknown address both fail safely. | Pending: deployment credentials/access unavailable |
| Logout | Sign out, reload the page, and query the session endpoint. Account details disappear and the session response is `null`. | Pending: deployment credentials/access unavailable |
| Session persistence | Sign in, reload the page, and open a new tab on the same origin. The same account remains authenticated until logout or expiry. | Pending: deployment credentials/access unavailable |
| Session expiry | Sign in, wait past the configured session lifetime, then reload and query the session endpoint. The session is rejected. Use an isolated production-equivalent deployment if a shorter lifetime is needed for this test. | Pending: deployment credentials/access unavailable |
| Password reset | Request a reset for the verified account. The UI returns a generic response and Resend delivers one reset message. Use the link with a policy-compliant new password. Existing sessions are revoked, the old password fails, and the new password succeeds. | Pending: deployment credentials/access unavailable |
| Reset token expiry | Request a reset, leave the link unused for more than one hour, then open it. The callback rejects the expired token and no password changes. | Pending: deployment credentials/access unavailable |
| Reset token replay | Complete one reset, sign out, then reuse the same link. The callback rejects it and the current password remains unchanged. | Pending: deployment credentials/access unavailable |
| Invalid callbacks | Open verification and reset callback URLs with missing, malformed, and random tokens. Each route shows a safe error, creates no session, and exposes no token or internal exception. | Pending: deployment credentials/access unavailable |
| Delivery failure | Only on a controlled deployment or maintenance window, configure a deliberately rejected sender or restricted test key, request verification and reset messages, and inspect sanitized server logs. The UI remains generic, no secret appears, and the operation does not report delivery success internally. Restore and recheck the valid configuration immediately. | Pending: deployment credentials/access unavailable |
| Google OAuth, optional | When enabled, start Google sign-in, approve the production client, and confirm callback, account, and session creation. Then test a denied consent or invalid callback and confirm a safe failure with no session. If credentials are absent, leave OAuth disabled and record it as pending. | Pending: deployment credentials/access unavailable |
| Anonymous authorization | With no cookies, load the home page and session endpoint. No user details are returned. Confirm the Convex current-user query resolves to no user. | Pending: deployment credentials/access unavailable |
| Identity-bound authorization | Sign in separately as user A and user B. Each session must return only its own identity. Confirm the current-user operation accepts no caller-supplied user or owner ID and resolves identity server-side from the session. | Pending: deployment credentials/access unavailable |

The application currently stores no private application resources. Cross-user resource access cannot be verified until such data exists. Before adding it, enforce ownership in every Convex query and mutation, then add a two-user test proving user B cannot read or change user A's resource. UI hiding and Next.js redirects are not authorization controls.

## Verification record

- Deployment origin: **Pending: deployment credentials/access unavailable**
- Convex deployment: **Pending: deployment credentials/access unavailable**
- Automated smoke check: **Pending: deployment credentials/access unavailable**
- Manual authentication matrix: **Pending: deployment credentials/access unavailable**
- Resend delivery: **Pending: deployment credentials/access unavailable**
- Google OAuth: **Pending: deployment credentials/access unavailable**
- Server-side authorization: **Pending: deployment credentials/access unavailable**
