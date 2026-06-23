import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatJSON, LLMNotConfiguredError } from "@/lib/ai/llm";
import { SYSTEM_STRATEGIST, generateBlockContentPrompt } from "@/lib/ai/prompts";

/** POST /api/ai/generate — genera contenido para un bloque. Body: { projectId, blockId, blockType } */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { projectId, blockId, blockType } = await req.json();
  const { data: project } = await supabase
    .from("projects").select("id,title,description,blocks").eq("id", projectId).single();
  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

  try {
    const content = await chatJSON<Record<string, unknown>>([
      { role: "system", content: SYSTEM_STRATEGIST },
      { role: "user", content: generateBlockContentPrompt(blockType, `${project.title}. ${project.description}`) },
    ]);

    const blocks = (project.blocks as { id: string; content?: unknown }[]).map((b) =>
      b.id === blockId ? { ...b, content } : b
    );
    await supabase.from("projects").update({ blocks, updated_at: new Date().toISOString() }).eq("id", projectId);

    return NextResponse.json({ content });
  } catch (e) {
    const status = e instanceof LLMNotConfiguredError ? 503 : 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
