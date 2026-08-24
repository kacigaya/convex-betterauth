<p align="center">
  <img src="public/convex.ico" alt="Convex" width="160">
  <img src="public/betterauth-white.png" alt="Better Auth" width="160">
</p>

<h1 align="center">Convex + Better Auth</h1>

<p align="center">A small Next.js App Router example with Convex-backed authentication.</p>

<p align="center">
  <a href="https://nextjs.org"><img alt="Next.js 16.3.2" src="https://shieldcn.dev/badge/Next.js-16.3.2-171717.svg?variant=secondary&amp;logo=nextdotjs"></a>
  <a href="https://www.convex.dev"><img alt="Convex 1.45.0" src="https://shieldcn.dev/badge/Convex-1.45.0-ee342f.svg?variant=secondary&amp;logo=convex"></a>
  <a href="https://www.better-auth.com"><img alt="Better Auth 1.6.30" src="https://shieldcn.dev/badge/Better_Auth-1.6.30-171717.svg?variant=secondary&amp;logo=betterauth"></a>
  <a href="https://tailwindcss.com"><img alt="Tailwind CSS 4.3" src="https://shieldcn.dev/badge/Tailwind_CSS-4.3-06b6d4.svg?variant=secondary&amp;logo=tailwindcss"></a>
  <a href="https://bun.sh"><img alt="Bun 1.3" src="https://shieldcn.dev/badge/Bun-1.3-fbf0df.svg?variant=secondary&amp;logo=bun&amp;logoColor=171717"></a>
  <a href="https://github.com/kacigaya/convex-betterauth/blob/main/LICENSE"><img alt="MIT License" src="https://shieldcn.dev/github/license/kacigaya/convex-betterauth.svg?variant=secondary"></a>
</p>

The application supports email/password registration, sign-in, sign-out, authenticated server rendering, and optional Google OAuth. The home page is public and shows account details only when Convex validates the current session.

A password reset screen lives at `/reset-password` and handles the token Better Auth appends to its emailed link. Sending that email requires `emailAndPassword.sendResetPassword` in `convex/auth.ts`, which this example leaves unconfigured.

## Screenshots

| | Dark | Light |
| --- | --- | --- |
| Sign in | <img src="public/screenshots/login-dark.png" alt="Sign in page in dark mode" width="380"> | <img src="public/screenshots/login-light.png" alt="Sign in page in light mode" width="380"> |
| Create account | <img src="public/screenshots/register-dark.png" alt="Create account page in dark mode" width="380"> | <img src="public/screenshots/register-light.png" alt="Create account page in light mode" width="380"> |
| Reset password | <img src="public/screenshots/reset-password-dark.png" alt="Reset password page in dark mode" width="380"> | <img src="public/screenshots/reset-password-light.png" alt="Reset password page in light mode" width="380"> |

## Stack

- Next.js 16 and React 19
- Convex with `@convex-dev/better-auth`
- Better Auth
- TypeScript and Tailwind CSS 4
- [coss ui](https://coss.com/ui) components on Base UI
- Bun for package management and tests

## Requirements

- [Bun](https://bun.sh/)
- A [Convex](https://www.convex.dev/) account

## Local setup

Clone and install the project:

```bash
git clone https://github.com/kacigaya/convex-betterauth.git
cd convex-betterauth
bun install
```

Start Convex and follow its prompts to create or select a development deployment:

```bash
bunx convex dev
```

The Convex CLI creates `.env.local` with `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, and `NEXT_PUBLIC_CONVEX_SITE_URL`. Keep that process running while developing.

Set the private Better Auth values on the Convex deployment, not in the Next.js environment:

```bash
bunx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
bunx convex env set SITE_URL http://localhost:3000
```

`.env.example` documents the frontend variables. If the Convex CLI has not created `.env.local` yet, copy it as a starting point:

```bash
cp .env.example .env.local
```

If `.env.local` already exists, do not run that copy command. Keep the Convex-generated values and add optional frontend settings manually.

Start Next.js in another terminal:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Next.js reads these from `.env.local` or the hosting platform:

| Variable | Required | Purpose |
| --- | --- | --- |
| `CONVEX_DEPLOYMENT` | Development only | Selects the Convex deployment for CLI commands. |
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Public Convex API URL. |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Yes | Public Convex HTTP Actions URL used by Better Auth. |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | No | Set to `true` only when Google credentials are configured on Convex. |

Convex deployment environment variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Yes | Random secret with at least 32 characters. Use a different value per environment. |
| `SITE_URL` | Yes | Canonical Next.js origin, without a trailing slash. |
| `GOOGLE_CLIENT_ID` | For Google OAuth | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | For Google OAuth | Google OAuth client secret. |

Google credentials must be configured together:

```bash
bunx convex env set GOOGLE_CLIENT_ID your-client-id
bunx convex env set GOOGLE_CLIENT_SECRET your-client-secret
```

Then set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` in the matching Next.js environment. The Google callback URL is:

```text
https://your-deployment.convex.site/api/auth/callback/google
```

## Commands

```bash
bun run dev        # Start Next.js development mode
bun run lint       # Run ESLint
bun run typecheck  # Run TypeScript without emitting files
bun run test       # Run focused tests
bun run build      # Create the production build
bun run start      # Serve the production build
```

Run `bunx convex dev` while editing Convex functions. It generates the typed client API and validates the backend against the selected deployment.

## Architecture

- `convex/auth.ts` owns Better Auth configuration, password enforcement, rate limiting, and the authenticated user query.
- `convex/http.ts` exposes Better Auth through Convex HTTP Actions.
- `src/lib/auth-server.ts` centralizes the Next.js server integration.
- `src/app/api/auth/[...all]/route.ts` proxies same-origin auth requests to Convex.
- `src/app/page.tsx` preloads the authenticated Convex query with a server-issued token.
- `src/app/convex.tsx` hydrates the client provider with that token.
- `/login` and `/register` redirect authenticated sessions on the server.

The home route is intentionally public. Authentication changes what it renders; it is not a protected application route. Any future private Convex query or mutation must validate identity inside its Convex handler. UI checks and Next.js redirects are not authorization boundaries.

## Production deployment

1. Deploy Convex with `bunx convex deploy` and note the production `.cloud` and `.site` URLs.
2. Set `BETTER_AUTH_SECRET` and the production `SITE_URL` on the production Convex deployment. Add Google credentials there only if OAuth is enabled.
3. Configure the three public Next.js variables on the hosting platform. `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` must match the Convex OAuth configuration.
4. Build and deploy Next.js.
5. Test registration, sign-in, sign-out, session persistence, and OAuth callbacks against the production origin.

Do not reuse development secrets in production or expose Convex deployment secrets through `NEXT_PUBLIC_*` variables.

## Deliberate limitation

Email ownership verification and password-reset email are not enabled because this repository has no outbound email provider. Add a real email transport and Better Auth verification/reset callbacks before using email identity as a trust signal. See [SECURITY_REVIEW.md](SECURITY_REVIEW.md) for the current security boundary.

## Documentation

- [Convex documentation](https://docs.convex.dev/)
- [Better Auth documentation](https://www.better-auth.com/docs)
- [Convex Better Auth component](https://labs.convex.dev/better-auth)
- [Next.js documentation](https://nextjs.org/docs)

## License

This project is open source.
