import { z } from "zod";

/**
 * 1. StatCard Props Schema
 * Single metric / KPI visualization with optional delta comparison.
 */
export const StatCardPropsSchema = z.object({
  label: z.string().min(1, "Label is required"),
  value: z.union([z.string(), z.number()]),
  delta: z.number().optional(),
  deltaDirection: z.enum(["up", "down"]).optional(),
});
export type StatCardProps = z.infer<typeof StatCardPropsSchema>;

/**
 * 2. LineChart Props Schema
 * Time series data or continuous trend plotting.
 */
export const LineChartPropsSchema = z.object({
  data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).min(1, "At least one data point is required"),
  xKey: z.string().min(1, "xKey is required"),
  yKey: z.string().min(1, "yKey is required"),
  seriesLabel: z.string().optional(),
});
export type LineChartProps = z.infer<typeof LineChartPropsSchema>;

/**
 * 3. BarChart Props Schema
 * Categorical comparisons and channel performance.
 */
export const BarChartPropsSchema = z.object({
  data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).min(1, "At least one data point is required"),
  xKey: z.string().min(1, "xKey is required"),
  yKey: z.string().min(1, "yKey is required"),
});
export type BarChartProps = z.infer<typeof BarChartPropsSchema>;

/**
 * 4. Table Props Schema
 * Ranked / tabular multi-column datasets.
 */
export const TablePropsSchema = z.object({
  columns: z.array(
    z.object({
      key: z.string().min(1, "Column key is required"),
      label: z.string().min(1, "Column label is required"),
    })
  ).min(1, "At least one column is required"),
  rows: z.array(z.record(z.string(), z.any())),
});
export type TableProps = z.infer<typeof TablePropsSchema>;

/**
 * 5. FunnelChart Props Schema
 * Stage-based conversion and drop-off analysis.
 */
export const FunnelChartPropsSchema = z.object({
  stages: z.array(
    z.object({
      label: z.string().min(1, "Stage label is required"),
      value: z.number(),
    })
  ).min(1, "At least one stage is required"),
});
export type FunnelChartProps = z.infer<typeof FunnelChartPropsSchema>;

/**
 * 6. PieChart Props Schema
 * Share of whole / distribution breakdown.
 */
export const PieChartPropsSchema = z.object({
  data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).min(1, "At least one data item is required"),
  labelKey: z.string().min(1, "labelKey is required"),
  valueKey: z.string().min(1, "valueKey is required"),
});
export type PieChartProps = z.infer<typeof PieChartPropsSchema>;

/**
 * Discriminated union of all supported Agent UI Payloads
 */
export const AgentUIPayloadSchema = z.discriminatedUnion("component", [
  z.object({
    component: z.literal("StatCard"),
    title: z.string().min(1, "Title is required"),
    props: StatCardPropsSchema,
    narration: z.string(),
  }),
  z.object({
    component: z.literal("LineChart"),
    title: z.string().min(1, "Title is required"),
    props: LineChartPropsSchema,
    narration: z.string(),
  }),
  z.object({
    component: z.literal("BarChart"),
    title: z.string().min(1, "Title is required"),
    props: BarChartPropsSchema,
    narration: z.string(),
  }),
  z.object({
    component: z.literal("Table"),
    title: z.string().min(1, "Title is required"),
    props: TablePropsSchema,
    narration: z.string(),
  }),
  z.object({
    component: z.literal("FunnelChart"),
    title: z.string().min(1, "Title is required"),
    props: FunnelChartPropsSchema,
    narration: z.string(),
  }),
  z.object({
    component: z.literal("PieChart"),
    title: z.string().min(1, "Title is required"),
    props: PieChartPropsSchema,
    narration: z.string(),
  }),
]);

export type AgentUIPayload = z.infer<typeof AgentUIPayloadSchema>;

export type ParseResult =
  | { success: true; data: AgentUIPayload }
  | { success: false; error: string; raw: unknown };

/**
 * Validates incoming agent output against the AgentUIPayload union.
 * This is the security boundary — never render unvalidated payloads.
 */
export function parseAgentUIPayload(json: unknown): ParseResult {
  let target = json;

  // Handle JSON string inputs
  if (typeof json === "string") {
    try {
      target = JSON.parse(json);
    } catch (err) {
      return {
        success: false,
        error: `Invalid JSON string: ${err instanceof Error ? err.message : String(err)}`,
        raw: json,
      };
    }
  }

  const result = AgentUIPayloadSchema.safeParse(target);
  if (!result.success) {
    const errorMessages = result.error.errors
      .map((e) => `${e.path.join(".") || "root"}: ${e.message}`)
      .join("; ");
    return {
      success: false,
      error: errorMessages,
      raw: target,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
