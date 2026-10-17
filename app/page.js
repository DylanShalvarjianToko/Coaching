"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { slugify, randomSuffix } from "../lib/stages";

function emptyAnswers() {
  return {
    name: "",
    role: "",
    company: "",
    referredBy: "",
    orgContext: "",
    engagementType: "individual",
    teamMembers: [{ name: "", role: "" }],
    toolAccess: "",
    connectors: "",
    aiComfort: 5,
    aiComfortNote: "",
    weeklyHours: "",
    primaryGoal: "",
    challenges: "",
    stylePref: "",
    contactChannel: "email",
    priorTraining: "no",
    priorTrainingNote: "",
    recordingConsent: "",
    confirmationEmail: "",
  };
}

export default function IntakePage() {
  const [a, setA] = useState(emptyAnswers());
  const [status, setStatus] = useState("idle"); // idle | submitting | done | fallback
  const [error, setError] = useState("");

  function set(field, value) {
    setA((prev) => ({ ...prev, [field]: value }));
  }

  function setTeamMember(idx, field, value) {
    setA((prev) => {
      const teamMembers = prev.teamMembers.slice();
      teamMembers[idx] = { ...teamMembers[idx], [field]: value };
      return { ...prev, teamMembers };
    });
  }

  function addTeamRow() {
    setA((prev) => ({ ...prev, teamMembers: [...prev.teamMembers, { name: "", role: "" }] }));
  }

  function removeTeamRow(idx) {
    setA((prev) => ({ ...prev, teamMembers: prev.teamMembers.filter((_, i) => i !== idx) }));
  }

  function validate() {
    const missing = [];
    if (!a.name) missing.push("your name");
    if (!a.role) missing.push("your role");
    if (!a.company) missing.push("company");
    if (!a.primaryGoal) missing.push("your goal");
    if (!a.recordingConsent) missing.push("the recording question");
    if (!a.confirmationEmail) missing.push("email address");
    return missing;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const missing = validate();
    if (missing.length) {
      setError("Please fill in: " + missing.join(", "));
      return;
    }
    setError("");
    setStatus("submitting");

    const teamMembers = a.teamMembers.filter((m) => m.name.trim() || m.role.trim());
    const row = {
      name: a.name,
      role: a.role,
      company: a.company,
      org_context: a.orgContext,
      referred_by: a.referredBy,
      engagement_type: teamMembers.length > 0 ? "team" : a.engagementType,
      team_members: teamMembers,
      tool_access: a.toolAccess,
      connectors: a.connectors,
      ai_comfort: Number(a.aiComfort),
      ai_comfort_note: a.aiComfortNote,
      weekly_hours_on_repetitive_tasks:
        a.weeklyHours === "" || isNaN(Number(a.weeklyHours)) ? null : Number(a.weeklyHours),
      primary_goal: a.primaryGoal,
      known_challenges: a.challenges,
      style_pref: a.stylePref,
      contact_channel: a.contactChannel,
      prior_training: a.priorTraining === "yes",
      prior_training_note: a.priorTrainingNote,
      recording_consent: a.recordingConsent === "yes",
      confirmation_email: a.confirmationEmail,
      date_intake_completed: new Date().toISOString().slice(0, 10),
      engagement_status: "lead",
    };

    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const slug = slugify(a.company) + "-" + randomSuffix();
      const { error: insertError } = await supabase.from("clients").insert({ ...row, slug });
      if (!insertError) {
        setStatus("done");
        return;
      }
      lastError = insertError;
      // 23505 = unique_violation (slug collision), retry with a fresh suffix.
      if (insertError.code !== "23505") break;
    }

    console.error("intake submit failed", lastError);
    setStatus("fallback");
  }

  if (status === "done") {
    const firstName = (a.name || "").trim().split(/\s+/)[0];
    const bookingUrl =
      "https://calendly.com/dylan-thetokoproject/30min?name=" +
      encodeURIComponent(a.name || "") +
      "&email=" +
      encodeURIComponent(a.confirmationEmail || "");
    return (
      <div className="page">
        <Masthead />
        <div className="thanks">
          <h2>Thank you{firstName ? ", " + firstName : ""}</h2>
          <p>
            Last step: pick a time for our 30-minute intro call. It is all about you and how you
            work, nothing to prepare.
          </p>
          <p>
            <a className="book-link" href={bookingUrl} target="_blank" rel="noopener noreferrer">
              Book your intro call
            </a>
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page">
      <Masthead />
      <form onSubmit={handleSubmit} noValidate>
        <fieldset>
          <legend>About you</legend>
          <Field label="Your name">
            <input type="text" value={a.name} onChange={(e) => set("name", e.target.value)} required />
          </Field>
          <Field label="Your role / title">
            <input type="text" value={a.role} onChange={(e) => set("role", e.target.value)} required />
          </Field>
          <Field label="Company">
            <input type="text" value={a.company} onChange={(e) => set("company", e.target.value)} required />
          </Field>
          <Field label="Who introduced you to Toko N·AI·TIVE?" hint="Optional.">
            <input type="text" value={a.referredBy} onChange={(e) => set("referredBy", e.target.value)} />
          </Field>
          <Field
            label="A bit about your team / where you sit in the org"
            hint="Optional. Team size, who you report to, whatever is relevant."
          >
            <textarea value={a.orgContext} onChange={(e) => set("orgContext", e.target.value)} />
          </Field>
          <div className="field">
            <label className="q">Is this just you, or a team?</label>
            <div className="radio-row">
              <label className="radio-opt">
                <input
                  type="radio"
                  checked={a.engagementType === "individual"}
                  onChange={() => set("engagementType", "individual")}
                />{" "}
                Just me
              </label>
              <label className="radio-opt">
                <input
                  type="radio"
                  checked={a.engagementType === "team"}
                  onChange={() => set("engagementType", "team")}
                />{" "}
                A team
              </label>
            </div>
          </div>
          {a.engagementType === "team" && (
            <div className="field">
              <label className="q">Who&rsquo;s on the team?</label>
              <p className="hint">Add each person&rsquo;s name and role.</p>
              <div className="team-list">
                {a.teamMembers.map((m, idx) => (
                  <div className="team-row" key={idx}>
                    <input
                      type="text"
                      placeholder="Name"
                      value={m.name}
                      onChange={(e) => setTeamMember(idx, "name", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Role"
                      value={m.role}
                      onChange={(e) => setTeamMember(idx, "role", e.target.value)}
                    />
                    <button type="button" className="remove-row" onClick={() => removeTeamRow(idx)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="ghost" onClick={addTeamRow}>
                + Add person
              </button>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend>Your AI today</legend>
          <Field
            label="What AI tools do you currently have access to?"
            hint="For example ChatGPT Plus, Claude, Copilot. Your best guess is fine, it doesn't need to be exact."
          >
            <textarea value={a.toolAccess} onChange={(e) => set("toolAccess", e.target.value)} />
          </Field>
          <Field
            label="Any connected tools or integrations you know of?"
            hint="Calendar, email, CRM, Notion, Slack, and so on. Not sure is a fine answer."
          >
            <textarea value={a.connectors} onChange={(e) => set("connectors", e.target.value)} />
          </Field>
          <div className="field">
            <label className="q">How confident are you using AI right now?</label>
            <div className="scale-row">
              <input
                type="range"
                min="1"
                max="10"
                value={a.aiComfort}
                onChange={(e) => set("aiComfort", e.target.value)}
              />
              <span className="scale-val">{a.aiComfort}</span>
            </div>
          </div>
          <Field label="One or two sentences on how you use AI today">
            <textarea value={a.aiComfortNote} onChange={(e) => set("aiComfortNote", e.target.value)} />
          </Field>
          <Field
            label="Roughly how many hours a week do you spend on repetitive work like email, documents, reports, scheduling or research?"
            hint="A rough guess is fine. We use it as your starting point."
          >
            <input
              type="number"
              min="0"
              max="80"
              step="0.5"
              inputMode="decimal"
              value={a.weeklyHours}
              onChange={(e) => set("weeklyHours", e.target.value)}
            />
          </Field>
        </fieldset>

        <fieldset>
          <legend>Your goals</legend>
          <Field label="If this goes well, what is different about your week three months from now?">
            <textarea value={a.primaryGoal} onChange={(e) => set("primaryGoal", e.target.value)} required />
          </Field>
          <Field label="What's already a known challenge or pain point?">
            <textarea value={a.challenges} onChange={(e) => set("challenges", e.target.value)} />
          </Field>
          <Field
            label="How do you like an assistant to communicate with you?"
            hint="For example direct and concise, or walk me through the reasoning."
          >
            <textarea value={a.stylePref} onChange={(e) => set("stylePref", e.target.value)} />
          </Field>
        </fieldset>

        <fieldset>
          <legend>Logistics</legend>
          <div className="field">
            <label className="q">Preferred contact channel</label>
            <select value={a.contactChannel} onChange={(e) => set("contactChannel", e.target.value)}>
              <option value="email">Email</option>
              <option value="slack">Slack</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="field">
            <label className="q">Have you had AI training/coaching before (with us or elsewhere)?</label>
            <div className="radio-row">
              <label className="radio-opt">
                <input
                  type="radio"
                  checked={a.priorTraining === "no"}
                  onChange={() => set("priorTraining", "no")}
                />{" "}
                No
              </label>
              <label className="radio-opt">
                <input
                  type="radio"
                  checked={a.priorTraining === "yes"}
                  onChange={() => set("priorTraining", "yes")}
                />{" "}
                Yes
              </label>
            </div>
          </div>
          <Field label="If yes, what did that cover?">
            <textarea value={a.priorTrainingNote} onChange={(e) => set("priorTrainingNote", e.target.value)} />
          </Field>
          <div className="field">
            <label className="q">Is it OK if I record and transcribe our calls?</label>
            <p className="hint">
              I use a tool called Granola to transcribe our calls so I can listen to you instead of
              taking notes. The transcript is used only to build your plan and your program
              materials. It stays private to me, is never shared, and I will delete it whenever you
              ask. Saying no is completely fine; I will take notes by hand instead.
            </p>
            <div className="radio-row">
              <label className="radio-opt">
                <input
                  type="radio"
                  checked={a.recordingConsent === "yes"}
                  onChange={() => set("recordingConsent", "yes")}
                />{" "}
                Yes
              </label>
              <label className="radio-opt">
                <input
                  type="radio"
                  checked={a.recordingConsent === "no"}
                  onChange={() => set("recordingConsent", "no")}
                />{" "}
                No
              </label>
            </div>
          </div>
          <Field label="Best email to reach you">
            <input
              type="email"
              value={a.confirmationEmail}
              onChange={(e) => set("confirmationEmail", e.target.value)}
              required
            />
          </Field>
        </fieldset>

        <div className="submit-row">
          <button type="submit" className="submit" disabled={status === "submitting"}>
            {status === "submitting" ? "Submitting..." : "Submit"}
          </button>
          <div className={"form-status" + (error ? " error" : "")}>{error}</div>
          {status === "fallback" && (
            <div className="fallback-box">
              Your answers couldn&rsquo;t be saved automatically. Please email them directly to{" "}
              <a
                href={
                  "mailto:dylan@thetokoproject.com?subject=" +
                  encodeURIComponent("AI Coaching Intake (backup submission)") +
                  "&body=" +
                  encodeURIComponent(
                    Object.entries({ ...row_preview(a) })
                      .map(([k, v]) => k + ": " + v)
                      .join("\n")
                  )
                }
              >
                dylan@thetokoproject.com
              </a>{" "}
              so nothing gets lost.
            </div>
          )}
        </div>
      </form>
      <Footer />
    </div>
  );
}

function row_preview(a) {
  const flat = { ...a };
  flat.teamMembers = (a.teamMembers || [])
    .filter((m) => m.name || m.role)
    .map((m) => `${m.name} (${m.role})`)
    .join(", ");
  return flat;
}

function Field({ label, hint, children }) {
  return (
    <div className="field">
      <label className="q">{label}</label>
      {hint && <p className="hint">{hint}</p>}
      {children}
    </div>
  );
}

function Masthead() {
  return (
    <header className="masthead">
      <p className="eyebrow">Toko N·AI·TIVE</p>
      <h1>Before our intro call</h1>
      <p className="sub">
        A few quick questions so our 30 minutes is spent on you, not on facts. About 5 minutes.
        Rough answers are fine.
      </p>
    </header>
  );
}

function Footer() {
  return <footer className="note">Toko N·AI·TIVE &middot; dylan@thetokoproject.com</footer>;
}
