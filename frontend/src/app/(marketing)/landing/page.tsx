import { LandingPage } from "./LandingPage";

export const metadata = {
  title: "Company OS — Your AI Workforce, Your Rules",
  description:
    "Company OS is a coordinated team of specialized AI agents — Marketing, Finance, Engineering — that runs your business day-to-day while you stay in control. Try the live demo instantly.",
  openGraph: {
    title: "Company OS — AI Workforce for Solo Founders",
    description:
      "Hire, coordinate, and audit a fleet of AI agents that run your startup operations autonomously.",
  },
};

export default function LandingRoute() {
  return <LandingPage />;
}
