import { createClient } from "@/lib/supabase/server";
import { StylesClient } from "@/components/styles-client";
import type { Project } from "@/lib/types";

export default async function StylesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects").select("id,title,aura").order("created_at", { ascending: false });
  return <StylesClient projects={(data ?? []) as Pick<Project, "id" | "title" | "aura">[]} />;
}
