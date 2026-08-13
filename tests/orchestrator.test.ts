import { describe, it, expect } from "vitest";
import { validateTaskInput } from "../src/lib/orchestration/task-validator";
import { buildWorkflowStages, createInitialTaskSteps } from "../src/lib/orchestration/workflow-builder";
import { SYSTEM_BOTS, getBotBySlug } from "../src/lib/bots/registry";

describe("NanoBot Orchestration & System Registry", () => {
  it("registers all 7 canonical bots correctly", () => {
    expect(SYSTEM_BOTS.length).toBe(7);
    const slugs = SYSTEM_BOTS.map((b) => b.slug);
    expect(slugs).toContain("chatbot");
    expect(slugs).toContain("codebot");
    expect(slugs).toContain("visionbot");
    expect(slugs).toContain("researchbot");
    expect(slugs).toContain("documentbot");
    expect(slugs).toContain("databot");
    expect(slugs).toContain("studybot");
  });

  it("finds bots by slug case-insensitively", () => {
    const visionBot = getBotBySlug("VisionBot");
    expect(visionBot).toBeDefined();
    expect(visionBot?.name).toBe("VisionBot");
    expect(visionBot?.category).toBe("Computer Vision");
  });

  it("validates task input correctly with Zod", () => {
    const valid = validateTaskInput({
      prompt: "Analyze this image and extract spatial features",
      preferredBot: "visionbot",
    });
    expect(valid.prompt).toBe("Analyze this image and extract spatial features");
    expect(valid.preferredBot).toBe("visionbot");
  });

  it("rejects empty task prompts", () => {
    expect(() => validateTaskInput({ prompt: "" })).toThrow();
  });

  it("builds specialized workflow stages for VisionBot", () => {
    const stages = buildWorkflowStages("visionbot");
    expect(stages.length).toBeGreaterThanOrEqual(7);
    const stepNames = stages.map((s) => s.stepName);
    expect(stepNames).toContain("Input Validation");
    expect(stepNames).toContain("Image Decoding & Validation");
    expect(stepNames).toContain("Tensor Transformation & Normalization");
    expect(stepNames).toContain("Spatial Feature Extraction");
    expect(stepNames).toContain("Visual Classification & Inference");
    expect(stepNames).toContain("Result Validation");
  });

  it("builds specialized workflow stages for DataBot", () => {
    const stages = buildWorkflowStages("databot");
    const stepNames = stages.map((s) => s.stepName);
    expect(stepNames).toContain("Tabular Ingestion & Type Inference");
    expect(stepNames).toContain("Statistical Distribution Profiling");
    expect(stepNames).toContain("Anomaly Detection & Outlier Isolation");
  });

  it("creates initial task steps with proper default state", () => {
    const steps = createInitialTaskSteps("test-task-1", "codebot");
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].status).toBe("waiting");
    expect(steps[0].progress).toBe(0);
    expect(steps[0].task_id).toBe("test-task-1");
  });
});
