// Canonical 5-stage program metadata, matching the Toko AI Coaching Process
// Reference (Rev. 3), Section 0. Shared by the dashboard page so the stage
// tracker never drifts from the source-of-truth process doc.
export const STAGES = [
  {
    n: 1,
    name: "Discovery",
    question: "Where are they now, and what's worth fixing first?",
    artifact: "Baseline survey results, 1-3 use-cases",
  },
  {
    n: 2,
    name: "What is AI",
    question: "How does this actually work, and how do I talk to it?",
    artifact: "Finished prompt (full + compact versions)",
  },
  {
    n: 3,
    name: "Tools",
    question: "What do they have access to, and how do I use it well?",
    artifact: "Tool-specific flows, connectors live",
  },
  {
    n: 4,
    name: "Agents",
    question: "How do I make AI do recurring work without re-explaining every time?",
    artifact: "Refined general-purpose agent + one specific agent",
  },
  {
    n: 5,
    name: "Handoff & Customer Success",
    question: "Can they run without me now?",
    artifact: "Checklist status, follow-up KPIs, SOP for open items",
  },
];

export function slugify(input) {
  return (
    (input || "client")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "client"
  );
}

export function randomSuffix() {
  return Math.random().toString(36).slice(2, 6);
}

// Client-facing labels for built_artifacts keys. Internal column names
// like "stage2_template" or "stage4_shell" should never reach a client,
// this is the single place that translates them. Any future key not
// listed here still gets a readable label instead of leaking the raw
// snake_case name.
export const ARTIFACT_LABELS = {
  stage1_baseline: "Your baseline & use-cases",
  stage2_template: "Your custom AI prompt",
  stage3_tools: "Your tool workflow",
  stage4_shell: "Your personal AI agent",
  stage4_specific: "Your specific-task agent",
  stage5_sop: "Your handoff checklist & SOP",
};

export function labelForArtifact(key) {
  if (ARTIFACT_LABELS[key]) return ARTIFACT_LABELS[key];
  const cleaned = (key || "")
    .replace(/^stage\d+_/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
  if (!cleaned) return "Deliverable";
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}
