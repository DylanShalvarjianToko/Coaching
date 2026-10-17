import { notFound } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import DashboardView from "./DashboardView";
import PlanView from "./PlanView";

export const dynamic = "force-dynamic"; // always read fresh data, never cache a client's dashboard

async function getClient(slug, token) {
  const { data, error } = await supabase.rpc("get_dashboard", {
    p_slug: slug,
    p_token: token || null,
  });
  if (error) {
    console.error("get_dashboard rpc error", error);
    return null;
  }
  return data && data.length ? data[0] : null;
}

// Only what the page renders goes to the browser. The full row (emails,
// tokens, intake answers) stays on the server. The logo lookup needs the
// email domain, never the address itself.
function logoEmail(email) {
  const domain = (email || "").split("@")[1];
  return domain ? `@${domain}` : "";
}

function forPlan(client) {
  return {
    name: client.name,
    company: client.company,
    branding: client.branding || {},
    logo_email: logoEmail(client.confirmation_email),
    dashboard_status: client.dashboard_status,
    engagement_status: client.engagement_status,
    plan: client.built_artifacts.phase1_plan,
  };
}

function forDashboard(client) {
  return {
    name: client.name,
    company: client.company,
    branding: client.branding || {},
    confirmation_email: logoEmail(client.confirmation_email),
    dashboard_status: client.dashboard_status,
    current_stage: client.current_stage,
    stage_log: client.stage_log,
    primary_goal: client.primary_goal,
    bespoke_kpi: client.bespoke_kpi,
    homework_log: client.homework_log,
    built_artifacts: client.built_artifacts,
    post_program_pulse: client.post_program_pulse,
  };
}

export default async function DashboardPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const client = await getClient(resolvedParams.slug, resolvedSearchParams?.token);
  if (!client) notFound();

  // Phase 1 (p1-14): a prospect with a plan sees the plan view. The full
  // three-phase redesign (p2-2) decides what replaces it after the yes.
  if (client.built_artifacts && client.built_artifacts.phase1_plan) {
    return <PlanView client={forPlan(client)} />;
  }
  return <DashboardView client={forDashboard(client)} />;
}
