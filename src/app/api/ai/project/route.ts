import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatJSON, LLMNotConfiguredError } from "@/lib/ai/llm";
import { SYSTEM_STRATEGIST, projectFromBriefPrompt } from "@/lib/ai/prompts";
import { newBlockId, randomAura, BLOCK_DEFS } from "@/lib/blocks";
import type { Block, BlockType } from "@/lib/types";

/** POST /api/ai/project — genera un proyecto completo a partir de un brief. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { brief } = await req.json();
  if (!brief?.trim()) return NextResponse.json({ error: "Falta el brief" }, { status: 400 });

  try {
    const result = await chatJSON<{
      title: string;
      description: string;
      blocks: { type: BlockType; title?: string }[];
    }>([
      { role: "system", content: SYSTEM_STRATEGIST },
      { role: "user", content: projectFromBriefPrompt(brief) },
    ]);

    const blocks: Block[] = (result.blocks ?? [])
      .filter((b) => b.type in BLOCK_DEFS)
      .map((b) => ({ id: newBlockId(), type: b.type, title: b.title || BLOCK_DEFS[b.type].name }));

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        owner_id: user.id,
        title: result.title || brief.slice(0, 80),
        description: result.description || "",
        aura: randomAura(),
        blocks,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from("ai_conversations").insert({
      project_id: project.id,
      messages: [
        { role: "user", content: brief, ts: Date.now() },
        { role: "assistant", content: JSON.stringify(result), ts: Date.now() },
      ],
    });

    return NextResponse.json({ project });
  } catch (e) {
    const status = e instanceof LLMNotConfiguredError ? 503 : 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
