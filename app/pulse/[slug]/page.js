"use client";

import { useState } from "react";
import { useSearchParams, useParams } from "next/navigation";

const PERIOD_LABEL = { day7: "7-day", day30: "30-day", day90: "90-day" };

export default function PulsePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const period = searchParams.get("period") || "";
  const token = searchParams.get("token") || "";

  const [confidence, setConfidence] = useState(5);
  const [hoursSaved, setHoursSaved] = useState("");
  const [stillUsing, setStillUsing] = useState("Yes, regularly");
  const [blockers, setBlockers] = useState("");
  const [state, setState] = useState("form"); // form | submitting | done | already | error
  const [errorMsg, setErrorMsg] = useState("");

  if (!slug || !period || !token) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Missing link details</h1>
          <p style={styles.p}>
            This pulse link looks incomplete. Copy the full link from the
            email, or ask Dylan to resend it.
          </p>
        </div>
      </main>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setState("submitting");
    try {
      const res = await fetch(
        "https://fwicxygudosjlguacubs.supabase.co/functions/v1/submit-pulse",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            period,
            token,
            confidence,
            hours_saved: hoursSaved,
            still_using: stillUsing,
            blockers,
          }),
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
              ? "This pulse was already answered, no action needed."
              : "Your answers are in. Appreciate you taking a minute."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>{PERIOD_LABEL[period] || "Pulse"} check-in</p>
        <h1 style={styles.h1}>Quick pulse check</h1>
        <p style={styles.p}>Four questions, about two minutes.</p>

        <form onSubmit={submit} style={styles.form}>
          <label style={styles.label}>
            On a scale of 1-10, how confident are you using AI tools right now?
            <input
              type="range"
              min="1"
              max="10"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              style={styles.range}
            />
            <span style={styles.rangeValue}>{confidence}/10</span>
          </label>

          <label style={styles.label}>
            Hours saved this week on the task we targeted
            <input
              type="text"
              value={hoursSaved}
              onChange={(e) => setHoursSaved(e.target.value)}
              placeholder="e.g. about 3 hours"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Still using the agent we built?
            <select
              value={stillUsing}
              onChange={(e) => setStillUsing(e.target.value)}
              style={styles.input}
            >
              <option>Yes, regularly</option>
              <option>Yes, occasionally</option>
              <option>No</option>
            </select>
          </label>

          <label style={styles.label}>
            Anything blocking you from using it more? (optional)
            <textarea
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              style={styles.textarea}
              rows={3}
            />
          </label>

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
    maxWidth: 480,
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
