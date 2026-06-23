"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import { UploadDropzone, type UploadedDoc } from "@/components/upload-dropzone";
import { BLOCK_DEFS, newBlockId, randomAura } from "@/lib/blocks";
import type { Block, BlockType, StrategistRec } from "@/lib/types";

interface Analysis {
  summary: { docType: string; objective: string; industry: string; audience: string };
  blocks: { type: BlockType; title?: string }[];
  mapping: { from: string; to: string; why?: string }[];
  recommendations: StrategistRec[];
}

export default function ImportPage() {
  const router = useRouter();
  const toast = useToast();
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [transforming, setTransforming] = useState(false);

  async function analyze() {
    if (!docs.length) return;
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: docs.map((d) => ({ name: d.name, type: d.type })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data);
      setChecked(Object.fromEntries((data.recommendations ?? []).map((_: unknown, i: number) => [i, true])));
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  }

  function finalBlocks(): Block[] {
    if (!analysis) return [];
    const base = (analysis.blocks ?? [])
      .filter((b) => b.type in BLOCK_DEFS)
      .map((b) => ({ id: newBlockId(), type: b.type, title: b.title || BLOCK_DEFS[b.type].name }));
    const extra = (analysis.recommendations ?? [])
      .filter((r, i) => checked[i] && r.addBlock && r.addBlock in BLOCK_DEFS)
      .map((r) => r.addBlock as BlockType)
      .filter((t) => !base.some((b) => b.type === t))
      .map((t) => ({ id: newBlockId(), type: t, title: BLOCK_DEFS[t].name }));
    // CTA / firma siempre al final
    const all = [...base, ...extra];
    all.sort((a, b) => endRank(a.type) - endRank(b.type));
    return all;
  }
  const endRank = (t: BlockType) => (t === "sign" ? 98 : t === "cta" ? 99 : 0);

  async function transform() {
    if (!analysis) return;
    setTransforming(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const blocks = finalBlocks();
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          owner_id: user!.id,
          title: docs[0].name.replace(/\.[a-z]+$/i, "").replace(/[-_]/g, " "),
          description: `${analysis.summary.docType} reinterpretado como experiencia. Objetivo: ${analysis.summary.objective}`,
          aura: randomAura(),
          blocks,
        })
        .select("id").single();
      if (error) throw error;

      // asociar documentos importados al proyecto
      for (const d of docs) {
        await supabase.from("documents").insert({
          project_id: project.id, type: d.type, name: d.name, file_url: d.file_url,
        });
      }
      toast("Documento transformado en experiencia — no es una copia, es una reinterpretación");
      router.push(`/projects/${project.id}`);
    } catch (e) {
      toast((e as Error).message);
      setTransforming(false);
    }
  }

  const preview = analysis ? finalBlocks() : [];

  return (
    <main className="mx-auto max-w-[1180px] px-7 pb-24 pt-11">
      <p className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Importación inteligente</p>
      <h1 className="font-display text-[clamp(28px,4vw,40px)] font-semibold leading-[1.08] tracking-tight">
        Tu PDF ya hizo su trabajo.<br />
        Ahora <em className="not-italic text-brand">convertilo en experiencia</em>.
      </h1>
      <p className="mt-2.5 max-w-[580px] text-[15px] leading-relaxed text-muted">
        Subí propuestas, reportes, catálogos o estrategias. La IA no los copia: los reinterpreta
        como bloques interactivos listos para compartir.
      </p>

      <div className="mt-7">
        <UploadDropzone onUploaded={(d) => setDocs((x) => [...x, ...d])} />
      </div>

      {docs.length > 1 && (
        <div className="rise mt-4 rounded-[13px] border-[1.5px] border-dashed border-brand bg-[#F7F7FF] px-4 py-3 text-[13px] leading-relaxed text-ink-2">
          <b className="text-brand">Sistema de conocimiento activado.</b> Detecté varios documentos:
          la IA va a combinar la información de todos en una única experiencia — sin duplicar secciones.
        </div>
      )}

      {docs.length > 0 && !analysis && (
        <button onClick={analyze} disabled={analyzing} className="btn-primary mt-5 !px-6">
          {analyzing ? "La IA está leyendo tus documentos…" : `Analizar ${docs.length} documento(s) con IA`}
        </button>
      )}

      {analysis && (
        <section className="rise mt-9">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-[19px] font-semibold">Reconstrucción inteligente</h2>
            <span className="font-mono text-[11.5px] text-muted">el documento no se copia: se reinterpreta</span>
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
            <div>
              {/* vista previa lado a lado */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                    <i className="h-2 w-2 rounded-full bg-[#C9CBD2]" /> Documento original · estático
                  </p>
                  {docs.map((d) => (
                    <div key={d.id} className="mb-3 rounded-[14px] border border-line bg-white p-5 shadow-sm">
                      <p className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted">{d.type}</p>
                      <h4 className="mt-1 text-sm font-bold">{d.name}</h4>
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="mt-3 border-t border-line pt-3">
                          <div className="h-1.5 rounded-full bg-[#EDEEF2]" />
                          <div className="mt-1.5 h-1.5 w-3/5 rounded-full bg-[#EDEEF2]" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="mb-2.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                    <i className="h-2 w-2 rounded-full bg-[#8B89FF]" /> Experiencia generada · interactiva
                  </p>
                  <div className="stage min-h-[200px] rounded-[14px] border border-[#23253A] p-4">
                    {preview.map((b) => (
                      <div key={b.id} className="rise mb-2 flex items-center gap-2.5 rounded-[11px] border border-white/15 bg-white/5 px-3 py-2.5 text-[13px] text-[#EDEEF6]">
                        <i className="grid h-[26px] w-[26px] flex-none place-items-center rounded-lg bg-[#8B89FF]/20 text-xs not-italic text-[#B9B8FF]">
                          {BLOCK_DEFS[b.type].icon}
                        </i>
                        {b.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* mapa de reconstrucción */}
              <div className="mt-4 rounded-[14px] border border-line bg-white px-5 py-4">
                <h4 className="font-display text-[15px] font-semibold">Mapa de reconstrucción</h4>
                <p className="mb-2 text-xs text-muted">Cómo la IA tradujo cada sección estática a un bloque interactivo.</p>
                {(analysis.mapping ?? []).map((m, i) => (
                  <div key={i} className="flex items-center gap-3 border-b border-line py-2 text-[13px] last:border-0">
                    <span className="min-w-0 flex-1 text-muted">{m.from}</span>
                    <span className="flex-none text-brand">→</span>
                    <span className="min-w-0 flex-1 font-semibold">
                      {m.to}
                      {m.why && <small className="block text-[11px] font-normal text-muted">{m.why}</small>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* centro de estrategia */}
            <aside className="rounded-card border border-line bg-gradient-to-b from-white to-[#F7F7FF] p-5">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold">
                AI Strategist
                <span className="rounded-full bg-brand px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-white">
                  Centro de estrategia
                </span>
              </h3>
              <div className="my-3.5 grid grid-cols-2 gap-2.5">
                {[
                  ["Tipo", analysis.summary.docType],
                  ["Objetivo", analysis.summary.objective],
                  ["Industria", analysis.summary.industry],
                  ["Público", analysis.summary.audience],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-[11px] border border-line bg-white px-3 py-2.5">
                    <label className="mb-0.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-muted">{l}</label>
                    <b className="block text-[12.5px] leading-tight">{v}</b>
                  </div>
                ))}
              </div>
              <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Recomendaciones</p>
              <div className="flex flex-col gap-2">
                {(analysis.recommendations ?? []).map((r, i) => (
                  <label key={i}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border bg-white px-3 py-2.5 transition ${
                      checked[i] ? "border-brand bg-[#FBFBFF]" : "border-line hover:border-[#C8CAD2]"
                    }`}>
                    <input type="checkbox" checked={!!checked[i]}
                      onChange={(e) => setChecked((c) => ({ ...c, [i]: e.target.checked }))}
                      className="mt-0.5 accent-brand" />
                    <p className="text-[12.5px] leading-snug text-muted">
                      <b className="block text-[13px] text-ink">{r.category}</b>
                      {r.message}
                    </p>
                  </label>
                ))}
              </div>
              <button onClick={transform} disabled={transforming}
                className="btn-primary mt-4 w-full font-display !text-[15px]">
                {transforming ? "Transformando…" : "Transformar en Experiencia →"}
              </button>
            </aside>
          </div>
        </section>
      )}
    </main>
  );
}
