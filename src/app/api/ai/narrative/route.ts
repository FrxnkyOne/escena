import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LLMNotConfiguredError } from "@/lib/ai/llm";
import { runSkill } from "@/lib/ai/skills/run";
import { SKILLS } from "@/lib/ai/skills/registry";
import { randomAura } from "@/lib/blocks";

/**
 * POST /api/ai/narrative
 * Body: { source: string, audience?: string }
 * Ejecuta el skill "Director de narrativa": contenido crudo → escenas, y crea
 * el proyecto. Las escenas se guardan en el mismo campo `blocks` (jsonb): son
 * compatibles con los bloques actuales, así que el proyecto aparece igual en
 * el dashboard mientras construimos el reproductor de escenas.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { source, audience } = await req.json();
  if (!source?.trim()) {
    return NextResponse.json({ error: "Falta el contenido (source)" }, { status: 400 });
  }

  try {
    const result = await runSkill(SKILLS["narrative-director"], { source, audience });

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        owner_id: user.id,
        title: result.title || source.slice(0, 80),
        description: result.description || "",
        aura: randomAura(),
        blocks: result.scenes,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from("ai_conversations").insert({
      project_id: project.id,
      messages: [
        { role: "user", content: source, ts: Date.now() },
        { role: "assistant", content: JSON.stringify(result), ts: Date.now() },
      ],
    });

    return NextResponse.json({ project, scenes: result.scenes });
  } catch (e) {
    const status = e instanceof LLMNotConfiguredError ? 503 : 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
