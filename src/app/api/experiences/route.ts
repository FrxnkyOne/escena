import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify, shortToken } from "@/lib/utils";

/** POST /api/experiences — crea (o devuelve) el client_space de un proyecto y lo publica. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { projectId } = await req.json();
  const { data: project } = await supabase
    .from("projects").select("id,title").eq("id", projectId).single();
  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

  const { data: existing } = await supabase
    .from("client_spaces").select("slug").eq("project_id", projectId).maybeSingle();

  let slug = existing?.slug;
  if (!slug) {
    slug = `${slugify(project.title) || "experiencia"}-${shortToken()}`;
    const { error } = await supabase.from("client_spaces").insert({ project_id: projectId, slug });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("projects")
    .update({ status: "live", updated_at: new Date().toISOString() })
    .eq("id", projectId);

  return NextResponse.json({ slug, url: `/experience/${slug}` });
}
