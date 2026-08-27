import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company OS — AI Autonomous Workforce for Solo Founders",
  description:
    "A coordinated team of specialized AI agents — Marketing, Finance, Engineering — that runs your business day-to-day while you stay in control.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
