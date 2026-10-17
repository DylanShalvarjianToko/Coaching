"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { STAGES, labelForArtifact } from "../../lib/stages";
import { resolvePalette, monogram, logoCandidates, contrastInk } from "../../lib/branding";

function useGlow(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onMove(e) {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
      el.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
    }
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [ref]);
}

export function Card({ className, delay, children }) {
  const ref = useRef(null);
  useGlow(ref);
  return (
    <div
      ref={ref}
      className={"card" + (className ? " " + className : "")}
      style={{ animationDelay: `${delay || 0}s` }}
    >
      {children}
    </div>
  );
}

export function LogoMark({ candidates, fallbackLabel }) {
  const [idx, setIdx] = useState(0);
  const src = candidates[idx];
  if (!src) {
    return <div className="monogram-badge">{fallbackLabel}</div>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="dash-logo-img"
      src={src}
      alt=""
      onError={() => setIdx((i) => i + 1)}
    />
  );
}

function Stepper({ currentStage, stageLog }) {
  const stage = currentStage || 1;
  // Fill the track up to the current stage's dot position (0% at stage 1,
  // 100% once stage 5 is reached), not just a fraction of stages "done".
  const fillPct = ((Math.min(Math.max(stage, 1), STAGES.length) - 1) / (STAGES.length - 1)) * 100;

  return (
    <div className="stepper">
      <div className="stepper-track">
        <div className="stepper-track-fill" style={{ width: `${fillPct}%` }} />
      </div>
      {STAGES.map((s) => {
        const done = stage > s.n;
        const current = stage === s.n;
        const logEntry = Array.isArray(stageLog) ? stageLog.find((l) => l.stage === s.n) : null;
        return (
          <div className="step-dot-wrap" key={s.n} tabIndex={0}>
            <span className={"step-dot" + (done ? " done" : "") + (current ? " current" : "")}>
              {done ? "✓" : s.n}
            </span>
            <div className="step-tooltip">
              <strong>{s.name}</strong>
              <span>{logEntry?.notes || s.question}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardView({ client }) {
  const shellRef = useRef(null);

  // This is a luxury hospitality brand surface: it always renders the light,
  // ivory-and-gold palette, regardless of the visitor's OS theme preference.
  // There is deliberately no dark mode here.
  const branding = client.branding || {};
  const palette = useMemo(
    () => resolvePalette(branding, client.company || client.name),
    [branding, client.company, client.name]
  );
  const variant = palette.light;
  const candidates = useMemo(
    () => logoCandidates(branding, client.confirmation_email),
    [branding, client.confirmation_email]
  );

  const style = {
    "--accent": variant.accent,
    "--accent-ink": variant.accentInk,
    "--accent-soft": variant.accentSoft,
    "--focus": variant.accent,
    "--on-accent": contrastInk(variant.accent),
  };

  const isPreview = client.dashboard_status === "pending_approval";

  return (
    <div className="dash-shell" style={style} ref={shellRef}>
      {isPreview && (
        <div className="preview-banner">
          PREVIEW &middot; not yet approved, not visible to {client.name || "the client"} until
          this link&rsquo;s approval action has been used.
        </div>
      )}

      <div className="dash-topbar">
        <div className="brand-block">
          <div className="dash-logo-wrap">
            <LogoMark candidates={candidates} fallbackLabel={monogram(client.company || client.name)} />
          </div>
          <div className="brand-divider" aria-hidden="true" />
          <div>
            <p className="eyebrow">Your AI Coaching Program</p>
            <h1>{client.company || client.name}</h1>
          </div>
        </div>

        <div className="topbar-controls">
          <Stepper currentStage={client.current_stage || 1} stageLog={client.stage_log} />
        </div>
      </div>

      <div className="bento">
        <Card className="hero" delay={0.02}>
          <h2>Your goal</h2>
          <div className="kpi-row">
            <div className="kpi">
              <div className="kpi-label">Stated goal</div>
              <div className="kpi-value kpi-text">
                {client.primary_goal || <span className="empty">Captured at intake</span>}
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Bespoke KPI</div>
              <div className="kpi-value kpi-text">
                {client.bespoke_kpi || <span className="empty">Set once Stage 1 refines it</span>}
              </div>
            </div>
          </div>
        </Card>

        <Card className="homework-card" delay={0.08}>
          <h2>Homework</h2>
          {Array.isArray(client.homework_log) && client.homework_log.length ? (
            <ul className="homework-list">
              {client.homework_log.map((h, i) => (
                <li key={i} className="homework-item">
                  <span>{h.item}</span>
                  <span className={"status-pill" + (h.status === "Done" ? " done" : "")}>
                    {h.status || "Not started"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">Nothing assigned yet. This fills in as the program moves along.</p>
          )}
        </Card>

        <Card className="artifacts-card" delay={0.14}>
          <h2>What we&rsquo;ve built so far</h2>
          {client.built_artifacts && Object.keys(client.built_artifacts).length ? (
            <ul className="artifact-list">
              {Object.entries(client.built_artifacts).map(([key]) => (
                <li key={key} className="homework-item">
                  <span>{labelForArtifact(key)}</span>
                  <span className="status-pill done">Ready</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">
              Nothing built yet. Your prompt template, tool flows, and agent will show up here as
              each stage happens.
            </p>
          )}
        </Card>

        <Card className="progress-card" delay={0.2}>
          <h2>Progress over time</h2>
          {client.post_program_pulse && Object.keys(client.post_program_pulse).length ? (
            <pre className="pulse-pre">{JSON.stringify(client.post_program_pulse, null, 2)}</pre>
          ) : (
            <p className="empty">
              Tracked from Stage 5 onward, then again at day 7, 30, and 90 after your program wraps.
            </p>
          )}
        </Card>
      </div>

      <footer className="note">The Toko Project &middot; dylan@thetokoproject.com</footer>
    </div>
  );
}
