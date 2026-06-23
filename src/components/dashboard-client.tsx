"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import { newBlockId, randomAura } from "@/lib/blocks";
import type { Project } from "@/lib/types";

const CHIPS = [
  "Pitch deck para clínica de estética en Dubái",
  "Reporte mensual interactivo de crecimiento en Instagram",
  "Onboarding para nuevo cliente de medios internacionales",
  "Portal de cliente para servicio de prensa",
];

const PHASES = ["Analizando objetivo…", "Diseñando narrativa…", "Eligiendo componentes…", "Componiendo experiencia…"];

export function DashboardClient({
  initialProjects,
  userName,
}: {
  initialProjects: Project[];
  userName: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [projects, setProjects] = useState(initialProjects);
  const [brief, setBrief] = useState("");
  const [phase, setPhase] = useState<string | null>(null);

  async function generate() {
    if (phase) return;
    const text = brief.trim();
    if (!text) return toast("Contame qué experiencia necesitás");

    // Fases visibles mientras el LLM trabaja de verdad.
    let i = 0;
    setPhase(PHASES[0]);
    const tick = setInterval(() => setPhase(PHASES[++i % PHASES.length]), 1400);

    try {
      const res = await fetch("/api/ai/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error generando el proyecto");
      setProjects((p) => [data.project, ...p]);
      setBrief("");
      toast("Experiencia creada — abrila para editar la estructura");
      router.push(`/projects/${data.project.id}`);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      clearInterval(tick);
      setPhase(null);
    }
  }

  async function createBlank() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("projects")
      .insert({
        owner_id: user!.id,
        title: "Nueva experiencia",
        description: "",
        aura: randomAura(),
        blocks: [
          { id: newBlockId(), type: "hero", title: "Hero Section" },
          { id: newBlockId(), type: "cta", title: "CTA" },
        ],
      })
      .select()
      .single();
    if (error) return toast(error.message);
    router.push(`/projects/${data.id}`);
  }

  const shared = projects.filter((p) => p.status === "live").length;

  return (
    <main className="mx-auto max-w-[1180px] px-7 pb-24 pt-11">
      <p className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        Workspace
      </p>
      <h1 className="font-display text-[clamp(28px,4vw,40px)] font-semibold leading-[1.08] tracking-tight">
        Buenas, {userName}.<br />
        ¿Qué experiencia <em className="not-italic text-brand">creamos hoy</em>?
      </h1>
      <p className="mt-2.5 max-w-[580px] text-[15px] leading-relaxed text-muted">
        Describí lo que necesitás y la IA diseña la narrativa, la navegación y los componentes.
        Vos dirigís; ella compone.
      </p>

      {/* barra IA */}
      <div className="mt-8">
        <div className="ai-ring">
          <div className="flex items-center gap-3.5 rounded-[19px] bg-white px-[18px] py-4">
            <div className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[11px] bg-brand-soft text-brand">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4L12 2z" fill="currentColor" />
              </svg>
            </div>
            <input
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder="Necesito una propuesta moderna para una agencia de marketing…"
              className="min-w-0 flex-1 bg-transparent text-[15.5px] outline-none placeholder:text-[#A2A5AD]"
              aria-label="Describí la experiencia"
            />
            <button
              onClick={generate}
              disabled={!!phase}
              className="rounded-[11px] bg-brand px-5 py-[11px] text-sm font-semibold text-white transition hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(50,49,224,.35)] disabled:opacity-60"
            >
              {phase ? "Generando…" : "Generar"}
            </button>
          </div>
        </div>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => setBrief(c)}
              className="rounded-full border border-line bg-white px-3.5 py-[7px] text-[12.5px] text-ink-2 transition hover:-translate-y-px hover:border-brand"
            >
              {c}
            </button>
          ))}
        </div>
        {phase && (
          <p className="mt-3.5 font-mono text-[12.5px] text-brand" role="status">
            <span className="pulse-dot mr-2 inline-block h-[7px] w-[7px] rounded-full bg-brand" />
            {phase}
          </p>
        )}
      </div>

      {/* tarjetas de creación */}
      <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
        <button
          onClick={createBlank}
          className="flex items-center gap-3.5 rounded-[15px] border border-line bg-white px-[18px] py-4 text-left transition hover:-translate-y-px hover:border-brand hover:shadow-lg"
        >
          <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-brand-soft text-[17px] text-brand">✦</span>
          <span>
            <b className="block text-sm">Crear desde cero</b>
            <span className="text-xs text-muted">Empezá con un lienzo vacío, bloque a bloque.</span>
          </span>
        </button>
        <button
          onClick={() => router.push("/import")}
          className="flex items-center gap-3.5 rounded-[15px] border border-line bg-white px-[18px] py-4 text-left transition hover:-translate-y-px hover:border-brand hover:shadow-lg"
        >
          <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-brand-soft text-[17px] text-brand">⇪</span>
          <span>
            <b className="block text-sm">Crear desde archivos existentes</b>
            <span className="text-xs text-muted">Subí un PDF, PPTX o DOCX y la IA lo reinterpreta.</span>
          </span>
        </button>
      </div>

      {/* grid de proyectos */}
      <div className="mb-4 mt-10 flex items-baseline justify-between">
        <h2 className="font-display text-[19px] font-semibold">Experiencias activas</h2>
        <span className="font-mono text-[11.5px] text-muted">
          {projects.length} proyectos · {shared} compartidos
        </span>
      </div>

      {projects.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
          Todavía no hay proyectos. Generá uno con la barra de IA, creá uno desde cero o importá un documento.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-5">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push(`/projects/${p.id}`)}
              className="rise overflow-hidden rounded-card border border-line bg-white text-left transition hover:-translate-y-[3px] hover:shadow-[0_16px_40px_rgba(20,20,40,.12)]"
            >
              <div className="relative flex h-[150px] items-end p-[18px]" style={{ background: p.aura }}>
                <h3 className="font-display text-[19px] font-semibold leading-tight tracking-tight text-white [text-shadow:0_2px_14px_rgba(0,0,0,.28)]">
                  {p.title}
                </h3>
              </div>
              <div className="flex items-center justify-between px-[18px] py-3 text-[13px] text-muted">
                <span className="flex items-center gap-2 font-medium">
                  <i className={`inline-block h-[7px] w-[7px] rounded-full ${p.status === "live" ? "bg-green-600" : "bg-[#C9CBD2]"}`} />
                  {p.status === "live" ? "Compartida" : "Borrador"}
                </span>
                <span className="font-mono text-[11px]">{(p.blocks ?? []).length} bloques</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
