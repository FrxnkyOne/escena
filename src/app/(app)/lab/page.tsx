"use client";

import { useState } from "react";

interface Scene {
  id: string;
  type: string;
  title: string;
  durationMs: number;
  transition: string;
}

interface NarrativeResult {
  project?: { id: string; title: string };
  scenes?: Scene[];
  error?: string;
}

const BRAND = "#3231E0";

export default function LabPage() {
  const [source, setSource] = useState("");
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NarrativeResult | null>(null);

  async function generate() {
    if (!source.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, audience: audience.trim() || undefined }),
      });
      const data: NarrativeResult = await res.json();
      if (!res.ok) {
        setError(
          res.status === 503
            ? "La IA no está configurada (revisá las variables LLM en Vercel)."
            : data.error || "Algo salió mal generando las escenas."
        );
        return;
      }
      setResult(data);
    } catch (e) {
      setError((e as Error).message || "Error de red.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F1F2F5] text-[#15161A] px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
          Backstage · Laboratorio
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Director de narrativa</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Pegá un brief o el texto de un documento y mirá cómo la IA lo convierte
          en una secuencia de escenas con arco narrativo.
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
          {loading ? "Generando escenas…" : "Generar escenas"}
        </button>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {result?.scenes && result.scenes.length > 0 && (
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
                    <span className="text-xs text-neutral-400">
                      {(s.durationMs / 1000).toFixed(1)}s · {s.transition}
                    </span>
                  </div>
                  <p className="mt-2 font-medium">{s.title}</p>
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
