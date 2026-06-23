"use client";
import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import { UploadDropzone } from "@/components/upload-dropzone";
import { BLOCK_DEFS, BLOCK_TYPES, newBlockId } from "@/lib/blocks";
import type { Block, BlockType, Project, StrategistRec } from "@/lib/types";

export function ProjectClient({
  initialProject,
  initialSlug,
}: {
  initialProject: Project;
  initialSlug: string | null;
}) {
  const toast = useToast();
  const [project, setProject] = useState(initialProject);
  const [slug, setSlug] = useState(initialSlug);
  const [score, setScore] = useState<number | null>(null);
  const [recs, setRecs] = useState<StrategistRec[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* ---------- persistencia (autoguardado con debounce) ---------- */
  const persist = useCallback((next: Partial<Project>) => {
    setProject((p) => {
      const merged = { ...p, ...next };
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const { error } = await createClient()
          .from("projects")
          .update({ ...next, updated_at: new Date().toISOString() })
          .eq("id", merged.id);
        if (error) toast(`Error guardando: ${error.message}`);
      }, 600);
      return merged;
    });
  }, [toast]);

  /* ---------- bloques ---------- */
  const addBlock = (type: BlockType) => {
    persist({ blocks: [...project.blocks, { id: newBlockId(), type, title: BLOCK_DEFS[type].name }] });
  };
  const removeBlock = (i: number) =>
    persist({ blocks: project.blocks.filter((_, idx) => idx !== i) });
  const moveBlock = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= project.blocks.length) return;
    const blocks = [...project.blocks];
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    persist({ blocks });
  };
  const renameBlock = (i: number, title: string) => {
    const blocks = project.blocks.map((b, idx) =>
      idx === i ? { ...b, title: title.trim() || BLOCK_DEFS[b.type].name } : b
    );
    persist({ blocks });
  };

  /* ---------- AI Strategist (endpoint real) ---------- */
  async function analyze() {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScore(typeof data.score === "number" ? data.score : null);
      setRecs(Array.isArray(data.recommendations) ? data.recommendations : []);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  }

  function applyRec(idx: number) {
    const rec = recs[idx];
    if (rec.addBlock && BLOCK_TYPES.includes(rec.addBlock)) addBlock(rec.addBlock);
    setRecs((r) => r.filter((_, i) => i !== idx));
    setScore((s) => (s === null ? null : Math.min(98, s + 6)));
    toast(rec.addBlock ? `Aplicado: ${BLOCK_DEFS[rec.addBlock].name} agregado` : "Sugerencia aplicada");
  }

  /* ---------- acciones ---------- */
  async function share() {
    setBusy("share");
    try {
      const res = await fetch("/api/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSlug(data.slug);
      setProject((p) => ({ ...p, status: "live" }));
      const url = `${location.origin}/experience/${data.slug}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      toast("URL pública copiada — esto es lo que verá tu cliente");
      window.open(url, "_blank");
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function exportPdf() {
    if (!slug) return toast("Primero compartí la experiencia para generar su URL");
    setBusy("pdf");
    try {
      const res = await fetch(`/api/export/pdf?slug=${slug}`);
      if (!res.ok) throw new Error((await res.json()).error ?? "Error exportando");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${slug}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function saveBlueprint() {
    setBusy("bp");
    try {
      const res = await fetch("/api/ai/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`Blueprint “${data.blueprint.name}” guardado en tu biblioteca`);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto max-w-[1180px] px-7 pb-24 pt-9">
      <div className="mb-5 flex items-center gap-2 text-[13.5px] text-muted">
        <Link href="/dashboard" className="hover:text-ink">Proyectos</Link>
        <span>›</span>
        <b className="text-ink">{project.title}</b>
      </div>

      {/* cabecera */}
      <div className="mb-6 overflow-hidden rounded-card border border-line bg-white">
        <div className="flex h-[120px] items-end px-6 py-5" style={{ background: project.aura }}>
          <input
            value={project.title}
            onChange={(e) => persist({ title: e.target.value })}
            className="w-full bg-transparent font-display text-[clamp(22px,3vw,30px)] font-semibold tracking-tight text-white outline-none [text-shadow:0_2px_14px_rgba(0,0,0,.3)]"
            aria-label="Título del proyecto"
          />
        </div>
        <div className="flex flex-wrap items-start gap-7 px-6 py-4">
          <Field label="Cliente">
            <input
              value={project.client_name}
              onChange={(e) => persist({ client_name: e.target.value })}
              placeholder="Por definir"
              className="bg-transparent text-sm font-semibold outline-none"
            />
          </Field>
          <Field label="Estado">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              project.status === "live" ? "bg-green-50 text-green-700" : "bg-[#EEEFF2] text-ink-2"
            }`}>
              {project.status === "live" ? "Compartida" : "Borrador"}
            </span>
          </Field>
          <Field label="Fecha">
            <b className="text-sm">{new Date(project.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}</b>
          </Field>
          <Field label="Componentes">
            <b className="text-sm">{project.blocks.length} bloques</b>
          </Field>
          <div className="min-w-[220px] flex-1">
            <input
              value={project.description}
              onChange={(e) => persist({ description: e.target.value })}
              placeholder="Descripción del proyecto…"
              className="w-full bg-transparent text-[13.5px] text-ink-2 outline-none"
            />
          </div>
          <div className="ml-auto flex flex-wrap gap-2.5">
            <button onClick={saveBlueprint} disabled={busy === "bp"} className="btn-ghost">
              {busy === "bp" ? "Guardando…" : "Guardar como Blueprint"}
            </button>
            <button onClick={exportPdf} disabled={busy === "pdf"} className="btn-ghost">
              {busy === "pdf" ? "Exportando…" : "Exportar PDF"}
            </button>
            <button onClick={share} disabled={busy === "share"} className="btn-dark bg-brand">
              {busy === "share" ? "Publicando…" : slug ? "Abrir experiencia →" : "Compartir →"}
            </button>
          </div>
        </div>
        {slug && (
          <p className="border-t border-line px-6 py-2.5 font-mono text-[11px] text-muted">
            URL pública: <span className="text-brand">{`/experience/${slug}`}</span> · el cliente entra solo con su nombre
          </p>
        )}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
        {/* constructor */}
        <section className="rounded-card border border-line bg-white p-5">
          <h3 className="font-display text-base font-semibold">Constructor de experiencia</h3>
          <p className="mb-4 mt-1 text-[12.5px] text-muted">
            Cada bloque es una pantalla navegable. Reordená con ↑ ↓, renombrá tocando el título.
          </p>
          <div className="flex flex-col gap-2.5">
            {project.blocks.map((b, i) => (
              <BlockRow key={b.id} block={b} index={i} total={project.blocks.length}
                onMove={moveBlock} onRemove={removeBlock} onRename={renameBlock} />
            ))}
            {project.blocks.length === 0 && (
              <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
                Sin bloques todavía. Agregá el primero desde la paleta.
              </p>
            )}
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">Agregar bloque</p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(118px,1fr))] gap-2">
              {BLOCK_TYPES.map((t) => (
                <button key={t} onClick={() => addBlock(t)}
                  className="flex flex-col items-center gap-1.5 rounded-[11px] border border-dashed border-line bg-white px-2 py-2.5 text-xs font-semibold text-ink-2 transition hover:-translate-y-px hover:border-brand hover:text-brand">
                  <i className="not-italic text-base">{BLOCK_DEFS[t].icon}</i>
                  {BLOCK_DEFS[t].name}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">
              Documentos del proyecto
            </p>
            <UploadDropzone projectId={project.id} compact />
          </div>
        </section>

        {/* AI Strategist */}
        <aside className="sticky top-[78px] rounded-card border border-line bg-gradient-to-b from-white to-[#F7F7FF] p-5">
          <h3 className="flex items-center gap-2 font-display text-base font-semibold">
            AI Strategist
            <span className="rounded-full bg-brand px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-white">
              Consultor
            </span>
          </h3>

          {score !== null && (
            <div className="my-4 flex items-center gap-3 rounded-[13px] border border-line bg-white px-3.5 py-3">
              <div className="score-ring grid h-[46px] w-[46px] flex-none place-items-center rounded-full font-mono text-xs font-semibold"
                style={{ "--p": score } as React.CSSProperties}>
                <b>{score}</b>
              </div>
              <div className="text-[12.5px] leading-snug text-muted">
                <b className="block text-[13px] text-ink">Potencial de conversión</b>
                Calculado por el modelo sobre la estructura actual.
              </div>
            </div>
          )}

          <button onClick={analyze} disabled={analyzing}
            className="btn-primary mb-3 mt-3 w-full !py-3 !text-sm">
            {analyzing ? "Analizando estructura…" : "Analizar con IA"}
          </button>

          <div className="flex flex-col gap-2.5">
            {recs.map((r, i) => (
              <div key={i} className="rise rounded-[13px] border border-line bg-white px-3.5 py-3">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-brand">{r.category}</span>
                <p className="my-1.5 text-[13px] leading-snug text-ink-2">{r.message}</p>
                <div className="flex gap-2">
                  <button onClick={() => applyRec(i)}
                    className="rounded-[9px] bg-brand px-3 py-1.5 text-xs font-semibold text-white">
                    {r.addBlock ? `Agregar ${BLOCK_DEFS[r.addBlock]?.name ?? r.addBlock}` : "Aplicar"}
                  </button>
                  <button onClick={() => setRecs((x) => x.filter((_, j) => j !== i))}
                    className="rounded-[9px] border border-line px-3 py-1.5 text-xs font-semibold">
                    Omitir
                  </button>
                </div>
              </div>
            ))}
            {!analyzing && recs.length === 0 && score !== null && (
              <p className="rounded-[13px] border border-line bg-white px-3.5 py-3 text-[13px] text-muted">
                Sin observaciones pendientes. Esta experiencia está lista para compartir.
              </p>
            )}
            {!analyzing && score === null && (
              <p className="text-[12.5px] leading-relaxed text-muted">
                El Strategist revisa storytelling, conversión, diseño y navegación de tu estructura
                usando el modelo conectado, y te devuelve mejoras accionables.
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-[110px]">
      <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{label}</label>
      {children}
    </div>
  );
}

function BlockRow({
  block, index, total, onMove, onRemove, onRename,
}: {
  block: Block; index: number; total: number;
  onMove: (i: number, d: -1 | 1) => void;
  onRemove: (i: number) => void;
  onRename: (i: number, title: string) => void;
}) {
  const def = BLOCK_DEFS[block.type];
  return (
    <div className="rise flex items-center gap-3 rounded-[13px] border border-line bg-[#FAFAFB] px-3.5 py-3 transition hover:border-[#C8CAD2]">
      <span className="w-[18px] flex-none font-mono text-[10.5px] text-muted">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[10px] bg-brand-soft text-[15px] text-brand">
        {def.icon}
      </span>
      <div className="min-w-0 flex-1">
        <input
          defaultValue={block.title}
          onBlur={(e) => onRename(index, e.target.value)}
          className="block w-full bg-transparent text-sm font-semibold outline-none focus:rounded focus:bg-white focus:shadow-[0_0_0_2px_var(--brand-soft)]"
        />
        <span className="text-xs text-muted">{def.desc}</span>
      </div>
      <div className="flex gap-1">
        <Ctl onClick={() => onMove(index, -1)} disabled={index === 0} label="Subir">↑</Ctl>
        <Ctl onClick={() => onMove(index, 1)} disabled={index === total - 1} label="Bajar">↓</Ctl>
        <Ctl onClick={() => onRemove(index)} label="Eliminar" danger>×</Ctl>
      </div>
    </div>
  );
}

function Ctl({ children, onClick, disabled, label, danger }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; label: string; danger?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label}
      className={`grid h-7 w-7 place-items-center rounded-lg border border-line bg-white text-[13px] text-ink-2 transition disabled:opacity-40 ${
        danger ? "hover:border-red-600 hover:text-red-600" : "hover:border-ink"
      }`}>
      {children}
    </button>
  );
}
