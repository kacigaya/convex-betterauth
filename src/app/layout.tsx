import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ConvexClientProvider } from "./convex";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Convex + BetterAuth",
  description: "Open source authentication for Next.js with Convex and BetterAuth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased transition-colors duration-300 bg-white dark:bg-black`}
      >
        <ThemeProvider defaultTheme="dark">
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
