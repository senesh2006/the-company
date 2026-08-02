import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/providers/app-provider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AgentDetailPanel } from "@/components/AgentDetailPanel";
import { cn } from "@/lib/utils";

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
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#0b0f17] text-slate-100 min-h-screen antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <AppProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Sidebar />
          <Topbar />
          <main className="ml-[280px] pt-20 px-6 md:px-10 pb-16 min-h-screen">
            <div className="max-w-[1440px] mx-auto">
              {children}
            </div>
          </main>
          <AgentDetailPanel />
        </AppProvider>
      </body>
    </html>
  );
}

