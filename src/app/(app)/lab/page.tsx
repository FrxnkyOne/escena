"use client";

import { useState } from "react";

interface LabScene {
  id: string;
  type: string;
  title: string;
  durationMs?: number;
  transition?: string;
  content?: Record<string, unknown>;
}

interface LabResult {
  project?: { id: string; title: string };
  scenes: LabScene[];
}

const BRAND = "#3231E0";
type Phase = "idle" | "structuring" | "scripting";

function asArray(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
}

function ContentPreview({ type, content }: { type: string; content?: Record<string, unknown> }) {
  if (!content || Object.keys(content).length === 0) {
    return (
      <p className="mt-2 text-xs italic text-neutral-400">
        Escena visual o interactiva (sin contenido de texto).
      </p>
    );
  }

  if (type === "hero") {
    return (
      <div className="mt-2 space-y-1">
        <p className="text-sm font-semibold">{String(content.headline ?? "")}</p>
        <p className="text-sm text-neutral-600">{String(content.lead ?? "")}</p>
      </div>
    );
  }

  if (type === "timeline") {
    return (
      <ul className="mt-2 space-y-1.5">
        {asArray(content.phases).map((p, i) => (
          <li key={i} className="text-sm">
            <span className="font-mono text-xs text-neutral-400">{String(p.when ?? "")}</span>{" "}
            <span className="font-medium">{String(p.title ?? "")}</span>
            <span className="text-neutral-600"> — {String(p.desc ?? "")}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (type === "pricing") {
    return (
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {asArray(content.plans).map((p, i) => (
          <div key={i} className="rounded-lg bg-neutral-50 p-2">
            <p className="text-xs font-mono uppercase text-neutral-400">{String(p.tier ?? "")}</p>
            <p className="text-sm font-semibold">{String(p.name ?? "")}</p>
            <ul className="mt-1 text-xs text-neutral-600">
              {(Array.isArray(p.features) ? (p.features as unknown[]) : []).map((f, j) => (
                <li key={j}>— {String(f)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  if (type === "quotes") {
    return (
      <div className="mt-2 space-y-2">
        {asArray(content.items).map((q, i) => (
          <div key={i} className="rounded-lg bg-neutral-50 p-2">
            <p className="text-sm italic text-neutral-700">“{String(q.quote ?? "")}”</p>
            <p className="mt-1 text-xs text-neutral-500">
              {String(q.author ?? "")} · {String(q.role ?? "")}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (type === "compare") {
    const cols = Array.isArray(content.columns) ? (content.columns as unknown[]) : [];
    return (
      <div className="mt-2 overflow-x-auto">
        <p className="text-xs text-neutral-400">{cols.map((c) => String(c)).join("  ·  ")}</p>
        <ul className="mt-1 space-y-1">
          {asArray(content.rows).map((r, i) => (
            <li key={i} className="text-sm">
              <span className="font-medium">{String(r.label ?? "")}:</span>{" "}
              <span className="text-neutral-600">
                {(Array.isArray(r.values) ? (r.values as unknown[]) : []).map((v) => String(v)).join("  /  ")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (type === "cta") {
    return (
      <div className="mt-2 space-y-1">
        <p className="text-sm font-semibold">{String(content.headline ?? "")}</p>
        <p className="text-sm text-neutral-600">{String(content.body ?? "")}</p>
        <span
          className="mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium text-white"
          style={{ backgroundColor: BRAND }}
        >
          {String(content.button ?? "")}
        </span>
      </div>
    );
  }

  return null;
}

export default function LabPage() {
  const [source, setSource] = useState("");
  const [audience, setAudience] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LabResult | null>(null);

  const loading = phase !== "idle";

  function readError(status: number, data: { error?: string }) {
    return status === 503
      ? "La IA no está configurada (revisá las variables LLM en Vercel)."
      : data.error || "Algo salió mal.";
  }

  async function generate() {
    if (!source.trim() || loading) return;
    setError(null);
    setResult(null);
    const aud = audience.trim() || undefined;
    try {
      // Paso 1: Director de narrativa → estructura de escenas.
      setPhase("structuring");
      const r1 = await fetch("/api/ai/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, audience: aud }),
      });
      const d1 = await r1.json();
      if (!r1.ok) {
        setError(readError(r1.status, d1));
        return;
      }

      // Paso 2: Guionista → contenido de cada escena.
      setPhase("scripting");
      const r2 = await fetch("/api/ai/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: d1.project.id, audience: aud }),
      });
      const d2 = await r2.json();
      if (!r2.ok) {
        // Mostramos al menos la estructura, avisando del fallo del guionista.
        setResult({ project: d1.project, scenes: d1.scenes });
        setError("Se armó la estructura, pero el Guionista falló: " + readError(r2.status, d2));
        return;
      }

      setResult({ project: d1.project, scenes: d2.blocks });
    } catch (e) {
      setError((e as Error).message || "Error de red.");
    } finally {
      setPhase("idle");
    }
  }

  const buttonLabel =
    phase === "structuring"
      ? "Ordenando la historia…"
      : phase === "scripting"
      ? "Escribiendo el guión…"
      : "Generar experiencia";

  return (
    <main className="min-h-screen bg-[#F1F2F5] text-[#15161A] px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
          Backstage · Laboratorio
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Director + Guionista</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Pegá un brief o el texto de un documento. La IA ordena la historia en
          escenas y después escribe el contenido de cada una.
        </p>

        <label className="mt-8 block text-sm font-medium">Contenido</label>
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          rows={8}
          placeholder="Pegá acá un brief, una propuesta, o el texto de un PDF…"
          className="mt-2 w-full resize-y rounded-xl border border-neutral-300 bg-white p-4 text-sm outline-none focus:border-[#3231E0]"
        />

        <label className="mt-4 block text-sm font-medium">Audiencia (opcional)</label>
        <input
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="Ej. inversores, clientes corporativos, equipo interno…"
          className="mt-2 w-full rounded-xl border border-neutral-300 bg-white p-3 text-sm outline-none focus:border-[#3231E0]"
        />

        <button
          onClick={generate}
          disabled={loading || !source.trim()}
          className="mt-6 rounded-full px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: BRAND }}
        >
          {buttonLabel}
        </button>

        {error && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {error}
          </div>
        )}

        {result && result.scenes.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold">{result.project?.title}</h2>
            <ol className="mt-4 space-y-3">
              {result.scenes.map((s, i) => (
                <li key={s.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: BRAND }}
                    >
                      {i + 1}
                    </span>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                      {s.type}
                    </span>
                    {typeof s.durationMs === "number" && (
                      <span className="text-xs text-neutral-400">
                        {(s.durationMs / 1000).toFixed(1)}s{s.transition ? ` · ${s.transition}` : ""}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-medium">{s.title}</p>
                  <ContentPreview type={s.type} content={s.content} />
                </li>
              ))}
            </ol>
            {result.project?.id && (
              <a
                href={`/projects/${result.project.id}`}
                className="mt-6 inline-block text-sm font-medium underline"
                style={{ color: BRAND }}
              >
                Abrir el proyecto generado →
              </a>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
