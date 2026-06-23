import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LLMNotConfiguredError } from "@/lib/ai/llm";
import { runSkill } from "@/lib/ai/skills/run";
import { SKILLS } from "@/lib/ai/skills/registry";
import type { Block } from "@/lib/types";

/**
 * POST /api/ai/script
 * Body: { projectId: string, audience?: string }
 * Carga el proyecto, ejecuta el skill "Guionista" sobre sus escenas, mete el
 * contenido escrito dentro de cada una y guarda. Devuelve las escenas con su
 * contenido ya completo.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { projectId, audience } = await req.json();
  if (!projectId) return NextResponse.json({ error: "Falta projectId" }, { status: 400 });

  try {
    const { data: project, error: loadErr } = await supabase
      .from("projects")
      .select("id, title, description, blocks")
      .eq("id", projectId)
      .single();
    if (loadErr || !project) throw loadErr ?? new Error("Proyecto no encontrado");

    const blocks: Block[] = Array.isArray(project.blocks) ? project.blocks : [];

    const result = await runSkill(SKILLS["scriptwriter"], {
      title: project.title,
      description: project.description ?? "",
      audience,
      scenes: blocks.map((b, index) => ({ index, type: b.type, title: b.title })),
    });

    const byIndex = new Map(result.scenes.map((s) => [s.index, s.content]));
    const updated: Block[] = blocks.map((b, index) => {
      const content = byIndex.get(index);
      return content && Object.keys(content).length > 0 ? { ...b, content } : b;
    });

    const { error: saveErr } = await supabase
      .from("projects")
      .update({ blocks: updated })
      .eq("id", projectId);
    if (saveErr) throw saveErr;

    return NextResponse.json({ blocks: updated });
  } catch (e) {
    const status = e instanceof LLMNotConfiguredError ? 503 : 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
