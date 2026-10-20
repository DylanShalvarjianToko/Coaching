"use client";

import { useState } from "react";
import { useSearchParams, useParams } from "next/navigation";

// One-time Stage 1 baseline survey and Stage 5 follow-up survey (First
// Client Readiness c2/c3). Same pattern as app/pulse/[slug]/page.js: no
// server-side data fetch, the slug/stage/token round-trip through the
// submit-survey Edge Function directly, keeping client-facing writes off
// the anon Supabase key entirely.

const STAGE1_QUESTIONS = [
  { key: "q1", type: "scale", label: "On a scale of 1 to 10, how confident are you using AI tools in your current role?" },
  { key: "q2", type: "text", label: "How many hours per week do you currently spend on tasks you suspect AI could help with?" },
  {
    key: "q3",
    type: "select",
    label: "Which of these best describes your current AI use?",
    options: [
      "Never used it",
      "Tried it a few times",
      "Use it occasionally",
      "Use it regularly for specific tasks",
      "Use it as a core part of my workflow",
    ],
  },
  { key: "q4", type: "text", label: "What AI tools do you currently have access to?" },
  { key: "q5", type: "textarea", label: "Describe, in a sentence or two, the last time you used AI for work, what you used it for, and how it went." },
  { key: "q6", type: "text", label: "What's the most repetitive or tedious part of your current role?" },
  { key: "q7", type: "text", label: "If you could hand off one task to an assistant tomorrow, what would it be?" },
  { key: "q8", type: "textarea", label: "Could you currently teach someone else anything about using AI? If so, what?" },
  { key: "q9", type: "textarea", label: "What does success from this coaching engagement look like to you, specifically?" },
];

const STAGE5_QUESTIONS = [
  { key: "q1", type: "scale", label: "On a scale of 1 to 10, how confident are you using AI tools in your current role? (Directly comparable to your baseline answer.)" },
  { key: "q2", type: "text", label: "How many hours per week are you now spending on the task(s) we targeted, compared to before?" },
  { key: "q3", type: "textarea", label: "Which of the use-cases we identified in Stage 1 are you still actively using?" },
  { key: "q4", type: "text", label: "Are you still using the agent we built? How often?" },
  { key: "q5", type: "textarea", label: "Has AI use changed any measurable outcome in your role (deal velocity, response time, output volume)? Describe." },
  { key: "q6", type: "textarea", label: "Could you now teach someone else what we covered? Have you?" },
  { key: "q7", type: "scale", label: "On a scale of 1 to 10, how likely are you to recommend this coaching to a colleague?" },
  { key: "q8", type: "textarea", label: "What's still unclear or unresolved, if anything?" },
  { key: "q9", type: "textarea", label: "Open feedback on the engagement itself." },
];

const STAGE_META = {
  "1": { questions: STAGE1_QUESTIONS, eyebrow: "Baseline survey", title: "Before we get started" },
  "5": { questions: STAGE5_QUESTIONS, eyebrow: "Follow-up survey", title: "Wrapping up the program" },
};

function defaultAnswers(questions) {
  const initial = {};
  questions.forEach((q) => {
    initial[q.key] = q.type === "scale" ? 5 : q.type === "select" ? q.options[0] : "";
  });
  return initial;
}

export default function SurveyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const stage = searchParams.get("stage") || "";
  const token = searchParams.get("token") || "";
  const meta = STAGE_META[stage];

  const [answers, setAnswers] = useState(() => (meta ? defaultAnswers(meta.questions) : {}));
  const [state, setState] = useState("form"); // form | submitting | done | already | error
  const [errorMsg, setErrorMsg] = useState("");

  if (!slug || !token || !meta) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Missing link details</h1>
          <p style={styles.p}>
            This survey link looks incomplete. Copy the full link from the
            email, or ask Dylan to resend it.
          </p>
        </div>
      </main>
    );
  }

  function setAnswer(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setState("submitting");
    try {
      const res = await fetch(
        "https://fwicxygudosjlguacubs.supabase.co/functions/v1/submit-survey",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, stage, token, answers }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Something went wrong submitting this.");
        setState("error");
        return;
      }
      setState(data.already ? "already" : "done");
    } catch {
      setErrorMsg("Couldn't reach the server. Check your connection and try again.");
      setState("error");
    }
  }

  if (state === "done" || state === "already") {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Thanks</h1>
          <p style={styles.p}>
            {state === "already"
              ? "This survey was already answered, no action needed."
              : "Your answers are in. Talk soon."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>{meta.eyebrow}</p>
        <h1 style={styles.h1}>{meta.title}</h1>
        <p style={styles.p}>
          Nine questions, about five minutes. Nothing here needs to be
          perfect, just honest.
        </p>

        <form onSubmit={submit} style={styles.form}>
          {meta.questions.map((q) => (
            <label key={q.key} style={styles.label}>
              {q.label}
              {q.type === "scale" && (
                <>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={answers[q.key]}
                    onChange={(e) => setAnswer(q.key, Number(e.target.value))}
                    style={styles.range}
                  />
                  <span style={styles.rangeValue}>{answers[q.key]}/10</span>
                </>
              )}
              {q.type === "select" && (
                <select
                  value={answers[q.key]}
                  onChange={(e) => setAnswer(q.key, e.target.value)}
                  style={styles.input}
                >
                  {q.options.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              )}
              {q.type === "text" && (
                <input
                  type="text"
                  value={answers[q.key]}
                  onChange={(e) => setAnswer(q.key, e.target.value)}
                  style={styles.input}
                />
              )}
              {q.type === "textarea" && (
                <textarea
                  value={answers[q.key]}
                  onChange={(e) => setAnswer(q.key, e.target.value)}
                  style={styles.textarea}
                  rows={3}
                />
              )}
            </label>
          ))}

          {state === "error" && <p style={styles.error}>{errorMsg}</p>}

          <button type="submit" disabled={state === "submitting"} style={styles.button}>
            {state === "submitting" ? "Sending..." : "Submit"}
          </button>
        </form>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FAFAF7",
    padding: "24px",
    fontFamily: "'Geist', -apple-system, sans-serif",
  },
  card: {
    maxWidth: 520,
    width: "100%",
    background: "#ffffff",
    border: "1px solid #dde1dd",
    borderRadius: 14,
    padding: "40px 32px",
    boxShadow: "0 1px 2px rgba(20,24,26,0.04), 0 4px 14px rgba(20,24,26,0.05)",
  },
  eyebrow: {
    fontFamily: "'Geist', -apple-system, sans-serif",
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#8a908d",
    margin: "0 0 10px",
  },
  h1: {
    fontFamily: "'Geist', -apple-system, sans-serif",
    fontWeight: 600,
    fontSize: 26,
    margin: "0 0 8px",
    color: "#14181a",
  },
  p: { color: "#5b6360", fontSize: 15, margin: "0 0 24px", lineHeight: 1.5 },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontSize: 14,
    color: "#14181a",
    fontWeight: 500,
  },
  input: {
    border: "1px solid #dde1dd",
    borderRadius: 9,
    padding: "10px 12px",
    fontSize: 14.5,
    fontFamily: "inherit",
  },
  textarea: {
    border: "1px solid #dde1dd",
    borderRadius: 9,
    padding: "10px 12px",
    fontSize: 14.5,
    fontFamily: "inherit",
    resize: "vertical",
  },
  range: { width: "100%" },
  rangeValue: {
    fontFamily: "'Geist', -apple-system, sans-serif",
    fontSize: 13,
    color: "#5b6360",
  },
  error: { color: "#a53f3f", fontSize: 13.5, margin: 0 },
  button: {
    fontFamily: "'Geist', -apple-system, sans-serif",
    fontSize: 12.5,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    background: "#1E4D2B",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "12px 16px",
    cursor: "pointer",
  },
};
