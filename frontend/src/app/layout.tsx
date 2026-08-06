import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/providers/app-provider";
import { FramerProvider } from "@/providers/framer-provider";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Company OS — AI Autonomous Workforce Control Plane",
  description: "Enterprise autonomous multi-worker orchestration, execution monitoring, and operations management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased selection:bg-emerald-500/20 selection:text-emerald-900">
        <AppProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <FramerProvider>
            <AppShell>
              {children}
            </AppShell>
          </FramerProvider>
        </AppProvider>
      </body>
    </html>
  );
}
