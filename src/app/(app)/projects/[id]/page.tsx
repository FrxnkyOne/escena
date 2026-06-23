import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectClient } from "@/components/project-client";
import type { Project } from "@/lib/types";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) notFound();

  const { data: space } = await supabase
    .from("client_spaces").select("slug").eq("project_id", id).maybeSingle();

  return <ProjectClient initialProject={project as Project} initialSlug={space?.slug ?? null} />;
}
