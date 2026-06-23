import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatJSON, LLMNotConfiguredError } from "@/lib/ai/llm";
import { SYSTEM_STRATEGIST, analyzeProjectPrompt, analyzeDocumentsPrompt } from "@/lib/ai/prompts";

/**
 * POST /api/ai/analyze
 * Body: { projectId } → analiza un proyecto existente (AI Strategist)
 *       { documents: [{name,type}] } → analiza documentos importados (reconstrucción)
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();

  try {
    if (body.projectId) {
      const { data: project, error } = await supabase
        .from("projects").select("id,title,description,blocks")
        .eq("id", body.projectId).single();
      if (error || !project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

      const analysis = await chatJSON<{ score: number; recommendations: unknown[] }>([
        { role: "system", content: SYSTEM_STRATEGIST },
        { role: "user", content: analyzeProjectPrompt(project) },
      ]);

      await supabase.from("ai_conversations").insert({
        project_id: project.id,
        messages: [
          { role: "user", content: "analyze:project", ts: Date.now() },
          { role: "assistant", content: JSON.stringify(analysis), ts: Date.now() },
        ],
      });
      return NextResponse.json(analysis);
    }

    if (Array.isArray(body.documents) && body.documents.length) {
      const analysis = await chatJSON([
        { role: "system", content: SYSTEM_STRATEGIST },
        { role: "user", content: analyzeDocumentsPrompt(body.documents) },
      ]);
      return NextResponse.json(analysis);
    }

    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  } catch (e) {
    const status = e instanceof LLMNotConfiguredError ? 503 : 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
