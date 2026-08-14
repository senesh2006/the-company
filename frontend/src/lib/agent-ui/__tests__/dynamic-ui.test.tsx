import { describe, it, expect } from "vitest";
import React from "react";
import { parseAgentUIPayload } from "../schema";
import { DynamicUI } from "@/components/agent-ui/DynamicUI";

describe("DynamicUI Component Fallback & Security Boundary", () => {
  it("parses and validates valid payloads correctly", () => {
    const payload = {
      component: "StatCard" as const,
      title: "Test Metric",
      props: { label: "Test", value: 100 },
      narration: "A test metric",
    };

    const parsed = parseAgentUIPayload(payload);
    expect(parsed.success).toBe(true);
  });

  it("handles null / undefined / corrupted payload gracefully in DynamicUI without throwing", () => {
    // Calling DynamicUI with invalid payloads must not throw
    expect(() => {
      DynamicUI({ payload: null });
    }).not.toThrow();

    expect(() => {
      DynamicUI({ payload: { component: "UnknownWidget", title: "Test" } });
    }).not.toThrow();

    expect(() => {
      DynamicUI({ rawJson: "{ broken json string ..." });
    }).not.toThrow();
  });
});
