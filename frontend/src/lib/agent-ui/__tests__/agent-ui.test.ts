import { describe, it, expect } from "vitest";
import { parseAgentUIPayload, AgentUIPayload } from "../schema";
import { AGENT_UI_REGISTRY, getRegisteredComponent } from "@/components/agent-ui/registry";

describe("Agent UI Schema & Validation (parseAgentUIPayload)", () => {
  describe("1. Valid Payloads for Each Component Type", () => {
    it("accepts a valid StatCard payload", () => {
      const payload: AgentUIPayload = {
        component: "StatCard",
        title: "Monthly Recurring Revenue",
        props: {
          label: "MRR",
          value: "$124,500",
          delta: 14.2,
          deltaDirection: "up",
        },
        narration: "MRR increased by 14.2% following the launch of the Growth plan.",
      };

      const result = parseAgentUIPayload(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.component).toBe("StatCard");
        expect(result.data.props.value).toBe("$124,500");
      }
    });

    it("accepts a valid LineChart payload", () => {
      const payload: AgentUIPayload = {
        component: "LineChart",
        title: "Daily Website Traffic",
        props: {
          data: [
            { date: "2026-08-01", visitors: 4200 },
            { date: "2026-08-02", visitors: 5100 },
            { date: "2026-08-03", visitors: 6300 },
          ],
          xKey: "date",
          yKey: "visitors",
          seriesLabel: "Unique Visitors",
        },
        narration: "Traffic surged over the weekend due to viral social mention.",
      };

      const result = parseAgentUIPayload(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.component).toBe("LineChart");
        expect(result.data.props.data.length).toBe(3);
      }
    });

    it("accepts a valid BarChart payload", () => {
      const payload: AgentUIPayload = {
        component: "BarChart",
        title: "Channel Acquisition Breakdown",
        props: {
          data: [
            { channel: "Organic Search", leads: 420 },
            { channel: "LinkedIn Ads", leads: 310 },
            { channel: "Referral", leads: 180 },
          ],
          xKey: "channel",
          yKey: "leads",
        },
        narration: "Organic search generated the highest lead volume this quarter.",
      };

      const result = parseAgentUIPayload(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.component).toBe("BarChart");
      }
    });

    it("accepts a valid Table payload", () => {
      const payload: AgentUIPayload = {
        component: "Table",
        title: "Top Performing Marketing Campaigns",
        props: {
          columns: [
            { key: "campaign", label: "Campaign Name" },
            { key: "spend", label: "Spend" },
            { key: "cpa", label: "CPA" },
            { key: "roas", label: "ROAS" },
          ],
          rows: [
            { campaign: "Summer Retargeting", spend: "$4,200", cpa: "$14.50", roas: "3.8x" },
            { campaign: "Product Hunt Launch", spend: "$1,500", cpa: "$8.20", roas: "5.1x" },
          ],
        },
        narration: "Product Hunt campaign achieved the lowest CPA and highest ROAS.",
      };

      const result = parseAgentUIPayload(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.component).toBe("Table");
        expect(result.data.props.columns.length).toBe(4);
        expect(result.data.props.rows.length).toBe(2);
      }
    });

    it("accepts a valid FunnelChart payload", () => {
      const payload: AgentUIPayload = {
        component: "FunnelChart",
        title: "Lead-to-Customer Funnel",
        props: {
          stages: [
            { label: "Website Visitors", value: 50000 },
            { label: "Lead Magnets", value: 12500 },
            { label: "Product Demos", value: 3200 },
            { label: "Closed Deals", value: 850 },
          ],
        },
        narration: "Demo-to-deal conversion remains healthy at 26.5%.",
      };

      const result = parseAgentUIPayload(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.component).toBe("FunnelChart");
        expect(result.data.props.stages.length).toBe(4);
      }
    });

    it("accepts a valid PieChart payload", () => {
      const payload: AgentUIPayload = {
        component: "PieChart",
        title: "Audience Demographics by Industry",
        props: {
          data: [
            { industry: "Fintech", count: 45 },
            { industry: "Healthtech", count: 25 },
            { industry: "E-commerce", count: 20 },
            { industry: "Others", count: 10 },
          ],
          labelKey: "industry",
          valueKey: "count",
        },
        narration: "Fintech accounts for nearly half of our current audience base.",
      };

      const result = parseAgentUIPayload(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.component).toBe("PieChart");
      }
    });

    it("accepts stringified JSON input cleanly", () => {
      const jsonString = JSON.stringify({
        component: "StatCard",
        title: "Customer Acquisition Cost",
        props: {
          label: "Blended CAC",
          value: "$34.20",
          delta: -8.5,
          deltaDirection: "down",
        },
        narration: "Blended CAC decreased by 8.5% due to improved organic rankings.",
      });

      const result = parseAgentUIPayload(jsonString);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.component).toBe("StatCard");
      }
    });
  });

  describe("2. Rejection of Unknown Component Names", () => {
    it("rejects unknown component names", () => {
      const payload = {
        component: "CustomUnknownWidget",
        title: "Unknown",
        props: {},
        narration: "Should fail",
      };

      const result = parseAgentUIPayload(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe("3. Rejection of Missing or Malformed Required Props", () => {
    it("rejects StatCard missing required 'value'", () => {
      const payload = {
        component: "StatCard",
        title: "Missing Value",
        props: { label: "Test Label" },
        narration: "Missing value prop",
      };

      const result = parseAgentUIPayload(payload);
      expect(result.success).toBe(false);
    });

    it("rejects LineChart missing required 'xKey'", () => {
      const payload = {
        component: "LineChart",
        title: "Missing Key",
        props: {
          data: [{ a: 1 }],
          yKey: "a",
        },
        narration: "Missing xKey",
      };

      const result = parseAgentUIPayload(payload);
      expect(result.success).toBe(false);
    });

    it("rejects Table missing required 'columns'", () => {
      const payload = {
        component: "Table",
        title: "Missing Columns",
        props: {
          rows: [{ a: 1 }],
        },
        narration: "Missing columns",
      };

      const result = parseAgentUIPayload(payload);
      expect(result.success).toBe(false);
    });

    it("rejects FunnelChart with empty stages", () => {
      const payload = {
        component: "FunnelChart",
        title: "Empty Funnel",
        props: {
          stages: [],
        },
        narration: "Empty stages array",
      };

      const result = parseAgentUIPayload(payload);
      expect(result.success).toBe(false);
    });

    it("rejects malformed JSON strings without throwing", () => {
      const invalidJson = "{ component: 'StatCard', broken... }";
      const result = parseAgentUIPayload(invalidJson);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid JSON string");
      }
    });
  });

  describe("4. Component Registry Integrity", () => {
    it("registers all 6 allowed components", () => {
      const components = ["StatCard", "LineChart", "BarChart", "Table", "FunnelChart", "PieChart"];
      for (const name of components) {
        const reg = getRegisteredComponent(name);
        expect(reg).toBeDefined();
        expect(reg?.component).toBeDefined();
        expect(reg?.schema).toBeDefined();
        expect(reg?.description).toBeDefined();
      }
    });
  });
});
