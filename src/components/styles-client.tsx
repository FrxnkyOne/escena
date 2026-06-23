"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import type { Project } from "@/lib/types";

const W1 = ["Aurora", "Sable", "Ámbar", "Niebla", "Cobalto", "Oasis", "Brisa", "Ónix", "Salina", "Magenta", "Cedro"];
const W2 = ["Dubái", "Seúl", "Norte", "Lumen", "Prensa", "Studio", "Privé", "Atlas", "Marea", "Folio"];

function makeGradient() {
  const h = Math.floor(Math.random() * 360);
  const h2 = (h + 30 + Math.random() * 40) | 0;
  const h3 = (h2 + 30 + Math.random() * 40) | 0;
  const s = (58 + Math.random() * 30) | 0;
  return `linear-gradient(135deg,hsl(${h} ${s}% ${(26 + Math.random() * 14) | 0}%),hsl(${h2} ${s}% ${(48 + Math.random() * 10) | 0}%),hsl(${h3} ${s - 8}% ${(72 + Math.random() * 12) | 0}%))`;
}

const SEED = [
  { name: "Jade Seúl", g: "linear-gradient(135deg,#0E6B5C,#1FA98C,#9BE8C9)" },
  { name: "Ámbar Dubái", g: "linear-gradient(135deg,#8A4B00,#E08A1E,#FFD98A)" },
  { name: "Ultramar Folio", g: "linear-gradient(135deg,#2A2ACB,#5E5BFF,#9FD0FF)" },
  { name: "Orquídea Privé", g: "linear-gradient(135deg,#5B2A86,#A14DD8,#F0B6FF)" },
];

export function StylesClient({ projects }: { projects: Pick<Project, "id" | "title" | "aura">[] }) {
  const toast = useToast();
  const [styles, setStyles] = useState(SEED);
  const [target, setTarget] = useState(projects[0]?.id ?? "");

  function generate() {
    const name = `${W1[(Math.random() * W1.length) | 0]} ${W2[(Math.random() * W2.length) | 0]}`;
    setStyles((s) => [{ name, g: makeGradient() }, ...s]);
    toast(`Estilo “${name}” generado — identidad fresca, nunca reciclada`);
  }

  async function apply(g: string, name: string) {
    if (!target) return toast("Creá un proyecto primero");
    const { error } = await createClient().from("projects").update({ aura: g }).eq("id", target);
    if (error) return toast(error.message);
    toast(`Estilo “${name}” aplicado al proyecto`);
  }

  return (
    <main className="mx-auto max-w-[1180px] px-7 pb-24 pt-11">
      <p className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Generador de estilos · módulo</p>
      <h1 className="font-display text-[clamp(28px,4vw,40px)] font-semibold leading-[1.08] tracking-tight">
        Cada cliente, una <em className="not-italic text-brand">identidad propia</em>.
      </h1>
      <p className="mt-2.5 max-w-[580px] text-[15px] leading-relaxed text-muted">
        Ningún cliente recibe un estilo reciclado. Generá identidades visuales y aplicalas a
        cualquier experiencia — quedan guardadas en el proyecto.
      </p>

      {projects.length > 0 && (
        <label className="mt-6 block max-w-sm">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Aplicar a</span>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className="input">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </label>
      )}

      <div className="mt-7 grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
        <button onClick={generate}
          className="flex min-h-[230px] flex-col items-center justify-center gap-2.5 rounded-card border-[1.5px] border-dashed border-line text-sm font-semibold text-muted transition hover:border-brand hover:text-brand">
          <i className="text-2xl not-italic">＋</i> Generar nuevo estilo
        </button>
        {styles.map((s) => (
          <article key={s.name + s.g} className="rise overflow-hidden rounded-card border border-line bg-white transition hover:-translate-y-[3px] hover:shadow-[0_16px_40px_rgba(20,20,40,.10)]">
            <div className="flex h-[120px] items-end p-3.5" style={{ background: s.g }}>
              <b className="font-display text-[17px] font-semibold text-white [text-shadow:0_2px_10px_rgba(0,0,0,.3)]">{s.name}</b>
            </div>
            <div className="p-4">
              <p className="text-[12.5px] leading-relaxed text-muted">
                <b className="font-display text-ink">Aa</b> · identidad cromática única para un solo cliente.
              </p>
              <button onClick={() => apply(s.g, s.name)}
                className="mt-3 w-full rounded-[9px] border border-line bg-white px-3 py-2 text-xs font-semibold transition hover:border-ink">
                Aplicar al proyecto
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
