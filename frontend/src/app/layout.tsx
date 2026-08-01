import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/providers/app-provider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Company - Control Plane",
  description: "AI Multi-Agent System Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable, "light")}>
      <body className={cn(inter.className, "bg-surface text-on-surface")}>
        <AppProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Sidebar />
          <Topbar />
          <main className="ml-[280px] pt-24 px-xl pb-xl min-h-screen">
            <div className="max-w-[1440px] mx-auto">
              {children}
            </div>
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
