/**
 * Anthropic & OpenAI / NVIDIA NIM tool-use definition schemas for the Marketing Agent Dynamic UI rendering tool.
 */

export const ANTHROPIC_RENDER_UI_TOOL_DEFINITION = {
  name: "render_ui",
  description:
    "Renders an interactive, live UI component for the user. Choose the component best suited for your data: " +
    "- 'StatCard': Use for a single KPI or key performance metric with optional delta trend indicators. " +
    "- 'LineChart': Use for time-series data, historical trajectories, or continuous numerical progressions over time. " +
    "- 'BarChart': Use for categorical comparisons (e.g. channel performance, regional breakdown, campaigns). " +
    "- 'Table': Use for ranked lists, multi-column tabular breakdown, or structured tabular data. " +
    "- 'FunnelChart': Use for multi-stage conversion funnels and user drop-off analysis. " +
    "- 'PieChart': Use for share-of-whole, audience segmentation, or market share distribution.",
  input_schema: {
    type: "object",
    properties: {
      component: {
        type: "string",
        enum: ["StatCard", "LineChart", "BarChart", "Table", "FunnelChart", "PieChart"],
        description: "The name of the component to render.",
      },
      title: {
        type: "string",
        description: "A clear, descriptive headline for this visual component.",
      },
      narration: {
        type: "string",
        description: "A concise 1-2 sentence analytical insight or takeaway displayed beneath the component.",
      },
      props: {
        type: "object",
        description: "The component-specific props matching the chosen component schema.",
      },
    },
    required: ["component", "title", "narration", "props"],
  },
};

/**
 * OpenAI / NVIDIA NIM Function Calling format.
 * Compatible with ChatOpenAI pointing to NVIDIA NIM endpoints (e.g. meta/llama-3.3-70b-instruct).
 */
export const OPENAI_NVIDIA_NIM_TOOL_DEFINITION = {
  type: "function" as const,
  function: {
    name: "render_ui",
    description:
      "Renders an interactive, live UI component on the user's dashboard. Choose the best component: " +
      "StatCard (single metric/KPI with delta), LineChart (time-series trend), BarChart (category comparisons), " +
      "Table (ranked list or tabular breakdown), FunnelChart (stage conversion & drop-off), PieChart (share of whole).",
    parameters: {
      type: "object",
      properties: {
        component: {
          type: "string",
          enum: ["StatCard", "LineChart", "BarChart", "Table", "FunnelChart", "PieChart"],
          description: "Component name from the registry.",
        },
        title: {
          type: "string",
          description: "Title headline for the UI card.",
        },
        narration: {
          type: "string",
          description: "1-2 sentence analytical insight or strategic takeaway.",
        },
        props: {
          type: "object",
          description: "Matching properties for the chosen component (e.g. { label, value, delta } for StatCard).",
        },
      },
      required: ["component", "title", "narration", "props"],
    },
  },
};

// Default export alias for backwards compatibility
export const RENDER_UI_TOOL_DEFINITION = ANTHROPIC_RENDER_UI_TOOL_DEFINITION;
