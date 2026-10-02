import type { Metadata } from "next";
import { Tenor_Sans, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { CommandPalette } from "@/components/layout/command-palette";

const tenorSans = Tenor_Sans({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SITE_TITLE = "NanoBot — AI Agents, Knowledge & Workflow Automation";
const SITE_DESCRIPTION =
  "Build AI workflows that actually run. NanoBot connects models, knowledge, and real integrations into workflows you can build, execute, inspect, and control — with an assistant for your inbox, calendar, and tasks.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s · NanoBot" },
  description: SITE_DESCRIPTION,
  applicationName: "NanoBot",
  keywords: [
    "AI workflow automation",
    "AI agents",
    "RAG platform",
    "LLM workflows",
    "workflow builder",
    "NLP platform",
    "AI integrations",
    "AI assistant",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "NanoBot",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${tenorSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-white text-neutral-900 font-sans antialiased selection:bg-neutral-900 selection:text-white">
        <AuthProvider>
          {children}
          <CommandPalette />
        </AuthProvider>
      </body>
    </html>
  );
}
