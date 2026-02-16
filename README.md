# Convex + BetterAuth

<div style="display: flex; justify-content: center; gap: 20px;">
  <img src="public/convex.ico" width="100" height="100" alt="Convex Logo">
  <img src="public/betterauth-white.png" width="100" height="100" alt="BetterAuth Logo">
</div>

A modern authentication application built with Next.js, featuring Convex as the backend-as-a-service and BetterAuth for authentication management. This project demonstrates a complete authentication flow with user registration, login, and session management.

## Features

- Complete authentication system with BetterAuth
- Real-time data synchronization with Convex
- Modern UI with Tailwind CSS v4 and Radix UI components
- Dark mode support with system preference detection
- Social authentication (Google)
- Password strength validation with visual feedback
- TypeScript for type safety

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) with App Router and Turbopack
- **Frontend**: [React 19](https://react.dev), TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com), [Radix UI](https://www.radix-ui.com), [shadcn/ui](https://ui.shadcn.com)
- **Backend**: [Convex](https://convex.dev) (Backend-as-a-Service)
- **Authentication**: [BetterAuth](https://better-auth.com) via [@convex-dev/better-auth](https://labs.convex.dev/better-auth)
- **Animations**: [Motion](https://motion.dev) (formerly Framer Motion)
- **Icons**: [Lucide React](https://lucide.dev), [Remix Icon](https://remixicon.com)

## Prerequisites

Before you begin, ensure you have the following installed:
- [Bun](https://bun.sh) (recommended) or Node.js 20.9+
- A Convex account ([convex.dev](https://convex.dev))

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/gayakaci20/convex-betterauth
cd convex-betterauth
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Configuration

Create a `.env.local` file and configure the following variables:

```env
# Convex Configuration
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site

# BetterAuth Configuration
BETTER_AUTH_SECRET=your-super-secret-key-here

# Local Development
SITE_URL=http://localhost:3000

# Social OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### Environment Variables Explained:

- **CONVEX_DEPLOYMENT**: Your Convex deployment identifier (from the Convex dashboard)
- **NEXT_PUBLIC_CONVEX_URL**: Your Convex deployment URL (public, used by client)
- **NEXT_PUBLIC_CONVEX_SITE_URL**: Your Convex site URL for authentication
- **BETTER_AUTH_SECRET**: A secure secret key for BetterAuth (generate a strong random string)
- **SITE_URL**: Your application URL (localhost for development)

### 4. Set Up Convex

1. **Create a Convex account** at [convex.dev](https://convex.dev)

2. **Initialize Convex in your project**:
   ```bash
   bunx convex dev
   ```

   This will create a new Convex deployment and generate the necessary configuration.

3. **Update your `.env.local`** with the values provided by Convex CLI

### 5. Generate BetterAuth Secret

```bash
openssl rand -base64 32
```

Add this secret to your `.env.local` file as `BETTER_AUTH_SECRET`.

### 6. Run the Development Server

```bash
bun run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
convex-betterauth/
├── convex/                    # Convex backend
│   ├── auth.config.ts         # OAuth provider configuration
│   ├── auth.ts                # Auth functions and user queries
│   ├── http.ts                # HTTP router for auth endpoints
│   └── convex.config.ts       # Convex app configuration
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/auth/[...all]/ # BetterAuth API handler
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── convex.tsx         # Convex client provider
│   │   ├── layout.tsx         # Root layout (providers)
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── ui/                # Base UI components (button, input, label, etc.)
│   │   ├── buttons/           # Page-specific button components
│   │   ├── input/             # Password input with strength validation
│   │   ├── social-auth.tsx    # Social login/register buttons
│   │   ├── darkmode-toggle.tsx
│   │   └── theme-provider.tsx # Dark mode context provider
│   └── lib/
│       ├── auth-client.ts     # BetterAuth client setup
│       ├── password-strength.ts # Shared password validation
│       └── utils.ts           # Utility functions (cn)
├── public/                    # Static assets
└── package.json
```

## Available Scripts

- `bun run dev` - Start development server with Turbopack
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint

## Authentication Flow

1. **User Registration** (`/register`) - Create new accounts with email/password or social providers
2. **User Login** (`/login`) - Sign in with credentials or social providers
3. **Session Management** - Real-time session validation via Convex
4. **Protected Content** - Authenticated users see their profile on the home page

## Deployment

### Vercel (Recommended)

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Ensure you set the environment variables on your deployment platform and update the `SITE_URL` to match your production domain.

## Troubleshooting

### Common Issues

1. **Convex connection errors**: Verify your `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` are correct
2. **Authentication not working**: Check that `BETTER_AUTH_SECRET` is set and `SITE_URL` matches your current domain
3. **Build errors**: Ensure all environment variables are properly set

### Getting Help

- [Convex Documentation](https://docs.convex.dev)
- [BetterAuth Documentation](https://better-auth.com)
- [Convex + BetterAuth Guide](https://labs.convex.dev/better-auth)
- [Next.js Documentation](https://nextjs.org/docs)

## License

This project is open source.
