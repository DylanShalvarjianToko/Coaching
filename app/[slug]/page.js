import { notFound } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import DashboardView from "./DashboardView";

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

export default async function DashboardPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const client = await getClient(resolvedParams.slug, resolvedSearchParams?.token);
  if (!client) notFound();

  return <DashboardView client={client} />;
}
