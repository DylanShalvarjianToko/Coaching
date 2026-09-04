"use client";

import { useSearchParams } from "next/navigation";

export default function ApprovedPage() {
  const searchParams = useSearchParams();
  const ok = searchParams.get("ok") !== "false";
  const title = searchParams.get("title") || (ok ? "Approved" : "Something went wrong");
  const message =
    searchParams.get("message") ||
    (ok
      ? "That action went through."
      : "That link didn't work. Ask for a fresh one to be sent.");

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={{ ...styles.h1, color: ok ? "#1d4a3e" : "#a53f3f" }}>{title}</h1>
        <p style={styles.p}>{message}</p>
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
    background: "#f1f3f1",
    padding: "24px",
    fontFamily: "'Source Sans 3', -apple-system, sans-serif",
  },
  card: {
    maxWidth: 480,
    width: "100%",
    background: "#ffffff",
    border: "1px solid #dde1dd",
    borderRadius: 14,
    padding: "40px 32px",
    textAlign: "center",
    boxShadow: "0 1px 2px rgba(20,24,26,0.04), 0 4px 14px rgba(20,24,26,0.05)",
  },
  h1: {
    fontFamily: "'Zilla Slab', Georgia, serif",
    fontWeight: 600,
    fontSize: 22,
    margin: "0 0 10px",
  },
  p: { color: "#5b6360", margin: 0, fontSize: 15, lineHeight: 1.5 },
};
