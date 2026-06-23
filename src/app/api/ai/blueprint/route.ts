import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatJSON, LLMNotConfiguredError } from "@/lib/ai/llm";
import { SYSTEM_STRATEGIST, blueprintFromProjectPrompt } from "@/lib/ai/prompts";

/** POST /api/ai/blueprint — guarda un proyecto como Blueprint (la IA nombra y categoriza). */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { projectId } = await req.json();
  const { data: project } = await supabase
    .from("projects").select("title,description,aura,blocks").eq("id", projectId).single();
  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

  let meta = { name: project.title, category: "General", description: project.description };
  try {
    meta = await chatJSON([
      { role: "system", content: SYSTEM_STRATEGIST },
      { role: "user", content: blueprintFromProjectPrompt(project) },
    ]);
  } catch (e) {
    if (!(e instanceof LLMNotConfiguredError)) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
    // Sin LLM configurado el guardado sigue funcionando con metadatos del proyecto.
  }

  const { data: blueprint, error } = await supabase
    .from("blueprints")
    .insert({
      owner_id: user.id,
      name: meta.name,
      category: meta.category,
      configuration: { description: meta.description, blocks: project.blocks, aura: project.aura },
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ blueprint });
}
