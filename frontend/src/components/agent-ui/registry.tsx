"use client";

import React from "react";
import { z } from "zod";
import { StatCard, StatCardPropsSchema } from "./StatCard";
import { LineChart, LineChartPropsSchema } from "./LineChart";
import { BarChart, BarChartPropsSchema } from "./BarChart";
import { Table, TablePropsSchema } from "./Table";
import { FunnelChart, FunnelChartPropsSchema } from "./FunnelChart";
import { PieChart, PieChartPropsSchema } from "./PieChart";
import {
  AgentUIPayload,
  StatCardProps,
  LineChartProps,
  BarChartProps,
  TableProps,
  FunnelChartProps,
  PieChartProps,
} from "@/lib/agent-ui/schema";

export type ComponentName =
  | "StatCard"
  | "LineChart"
  | "BarChart"
  | "Table"
  | "FunnelChart"
  | "PieChart";

export interface ComponentRegistration<P = any> {
  component: React.ComponentType<P>;
  schema: z.ZodType<P>;
  description: string;
}

export const AGENT_UI_REGISTRY: Record<ComponentName, ComponentRegistration> = {
  StatCard: {
    component: StatCard,
    schema: StatCardPropsSchema,
    description: "Single KPI or metric visualization with optional delta trend indicators.",
  },
  LineChart: {
    component: LineChart,
    schema: LineChartPropsSchema,
    description: "Continuous time-series trend or progression chart.",
  },
  BarChart: {
    component: BarChart,
    schema: BarChartPropsSchema,
    description: "Categorical comparisons and channel performance metrics.",
  },
  Table: {
    component: Table,
    schema: TablePropsSchema,
    description: "Ranked lists, multi-column tabular breakdown, or structured records.",
  },
  FunnelChart: {
    component: FunnelChart,
    schema: FunnelChartPropsSchema,
    description: "Multi-stage conversion funnel and drop-off analysis.",
  },
  PieChart: {
    component: PieChart,
    schema: PieChartPropsSchema,
    description: "Share of whole, audience breakdown, or channel distribution.",
  },
};

export function getRegisteredComponent(name: string): ComponentRegistration | undefined {
  return (AGENT_UI_REGISTRY as Record<string, ComponentRegistration>)[name];
}

export {
  StatCard,
  LineChart,
  BarChart,
  Table,
  FunnelChart,
  PieChart,
};
