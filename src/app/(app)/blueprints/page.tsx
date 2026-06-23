import { createClient } from "@/lib/supabase/server";
import { BlueprintsClient } from "@/components/blueprints-client";
import type { Blueprint } from "@/lib/types";

export default async function BlueprintsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blueprints").select("*").order("created_at", { ascending: false });
  return <BlueprintsClient initial={(data ?? []) as Blueprint[]} />;
}
