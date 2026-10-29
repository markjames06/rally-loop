import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { ToastProvider } from "@/components/ui/toast";

const dmSans = localFont({
  src: "./fonts/dm-sans-latin.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "100 1000",
});

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "RallyLoop | Every game. One queue.",
  description:
    "Less waiting around. More time on court. RallyLoop brings players, sessions, and court rotations together in one simple place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={dmSans.variable} lang="en">
      <body className="min-h-screen antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
