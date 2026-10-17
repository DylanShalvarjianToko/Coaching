"use client";

// Phase 1 plan view (p1-14). Approved exception to the locked dashboard
// design: same shell, cards, fonts, accent and logo as DashboardView, with
// the five plan sections from the Phase 1 playbook (p1-4) in their fixed
// order. Renders built_artifacts.phase1_plan only; every word of client
// copy below the headings comes from that approved plan.

import { useMemo } from "react";
import { resolvePalette, monogram, logoCandidates, contrastInk } from "../../lib/branding";
import { Card, LogoMark } from "./DashboardView";

const BOOKING_URL = "https://calendly.com/dylan-thetokoproject/30min";

function hoursLabel(low, high) {
  const ok = (v) => typeof v === "number" && isFinite(v) && v > 0;
  if (!ok(low) && !ok(high)) return "Estimate pending";
  const lo = ok(low) ? low : high;
  const hi = ok(high) ? high : low;
  const unit = hi === 1 ? "hour" : "hours";
  if (lo === hi) return `About ${lo} ${unit} a week (estimate)`;
  return `About ${lo} to ${hi} hours a week (estimate)`;
}

function Fact({ label, children }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <div className="plan-fact">
      <div className="kpi-label">{label}</div>
      <div className="plan-fact-value">{children}</div>
    </div>
  );
}

export default function PlanView({ client }) {
  const plan = client.plan || {};
  const profile = plan.profile || {};
  const opportunities = Array.isArray(plan.opportunities)
    ? [...plan.opportunities].sort((a, b) => (a.rank || 0) - (b.rank || 0)).slice(0, 3)
    : [];
  const sessions = Array.isArray(plan.sessions)
    ? [...plan.sessions].sort((a, b) => (a.n || 0) - (b.n || 0))
    : [];

  const branding = client.branding || {};
  const palette = useMemo(
    () => resolvePalette(branding, client.company || client.name),
    [branding, client.company, client.name]
  );
  const variant = palette.light;
  const candidates = useMemo(
    () => logoCandidates(branding, client.logo_email),
    [branding, client.logo_email]
  );
  const style = {
    "--accent": variant.accent,
    "--accent-ink": variant.accentInk,
    "--accent-soft": variant.accentSoft,
    "--focus": variant.accent,
    "--on-accent": contrastInk(variant.accent),
  };

  const firstName = (client.name || "").trim().split(/\s+/)[0];
  const isPreview = client.dashboard_status === "pending_approval";
  const showNextStep = !["active", "alumni"].includes(client.engagement_status);
  const bookingUrl = client.name
    ? `${BOOKING_URL}?name=${encodeURIComponent(client.name)}`
    : BOOKING_URL;
  const confidence =
    typeof profile.confidence === "number" && profile.confidence > 0
      ? `${profile.confidence} of 10`
      : null;
  const baseline =
    typeof profile.baseline_hours === "number" && profile.baseline_hours > 0
      ? `About ${profile.baseline_hours} hours a week on repetitive work (your estimate)`
      : null;

  return (
    <div className="dash-shell" style={style}>
      {isPreview && (
        <div className="preview-banner">
          PREVIEW &middot; not approved yet. {client.name || "The client"} cannot see this page
          until Dylan approves the plan.
        </div>
      )}

      <div className="dash-topbar">
        <div className="brand-block">
          <div className="dash-logo-wrap">
            <LogoMark candidates={candidates} fallbackLabel={monogram(client.company || client.name)} />
          </div>
          <div className="brand-divider" aria-hidden="true" />
          <div>
            <p className="eyebrow">Your plan{firstName ? `, prepared for ${firstName}` : ""}</p>
            <h1>{client.company || client.name}</h1>
          </div>
        </div>
      </div>

      <div className="bento plan-bento">
        <Card className="hero plan-profile" delay={0.02}>
          <h2>Your profile</h2>
          <div className="plan-profile-grid">
            <div className="plan-profile-text">
              {profile.summary && <p className="plan-lead">{profile.summary}</p>}
              {profile.typical_week && <p>{profile.typical_week}</p>}
            </div>
            <div className="plan-facts">
              <Fact label="Your goal">{profile.goal}</Fact>
              <Fact label="Tools today">{profile.tools}</Fact>
              <Fact label="AI confidence today">{confidence}</Fact>
              <Fact label="Starting point">{baseline}</Fact>
              <Fact label="What's in the way">{profile.blockers}</Fact>
            </div>
          </div>
        </Card>

        <Card className="plan-opps" delay={0.08}>
          <h2>Your top 3 opportunities</h2>
          <ol className="opp-grid">
            {opportunities.map((o, i) => (
              <li className="opp" key={o.rank || i}>
                <div className="opp-rank">{o.rank || i + 1}</div>
                <h3 className="opp-title">{o.title}</h3>
                {o.where_in_week && (
                  <>
                    <div className="kpi-label">Where it shows up in your week</div>
                    <p>{o.where_in_week}</p>
                  </>
                )}
                {o.what_changes && (
                  <>
                    <div className="kpi-label">What changes</div>
                    <p>{o.what_changes}</p>
                  </>
                )}
                <div className="opp-foot">
                  <span className="status-pill done">{hoursLabel(o.hours_low, o.hours_high)}</span>
                  {o.session ? <span className="status-pill">Session {o.session}</span> : null}
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="plan-sessions" delay={0.14}>
          <h2>Your plan: four working sessions</h2>
          <ol className="session-list">
            {sessions.map((s) => (
              <li className="session" key={s.n}>
                <span className="step-dot current">{s.n}</span>
                <div>
                  <div className="session-focus">{s.focus}</div>
                  {s.outcome && <p>{s.outcome}</p>}
                </div>
              </li>
            ))}
          </ol>
          {plan.cadence_note && <p className="plan-note">{plan.cadence_note}</p>}
        </Card>

        <Card className="plan-quick" delay={0.2}>
          <h2>One thing to try this week</h2>
          <p className="plan-lead">{plan.quick_win}</p>
        </Card>

        {showNextStep && (
          <Card className="plan-next" delay={0.26}>
            <h2>Next step</h2>
            <p>Grab 15 minutes so I can walk you through this.</p>
            <a className="book-link plan-book" href={bookingUrl} target="_blank" rel="noopener noreferrer">
              Pick a time
            </a>
            <p className="plan-note">The booking link says 30 minutes, but we only need about 15.</p>
          </Card>
        )}
      </div>

      <footer className="note">Toko N·AI·TIVE &middot; dylan@thetokoproject.com</footer>
    </div>
  );
}
