import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard-client";
import type { Project } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: projects }, { data: profile }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("name").eq("id", user!.id).single(),
  ]);

  return (
    <DashboardClient
      initialProjects={(projects ?? []) as Project[]}
      userName={profile?.name?.split(" ")[0] || "creador"}
    />
  );
}
