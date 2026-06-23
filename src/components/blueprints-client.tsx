"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import { BLOCK_DEFS, newBlockId, randomAura } from "@/lib/blocks";
import type { Block, Blueprint } from "@/lib/types";

export function BlueprintsClient({ initial }: { initial: Blueprint[] }) {
  const router = useRouter();
  const toast = useToast();
  const [blueprints] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function useBlueprint(bp: Blueprint) {
    setBusy(bp.id);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const blocks: Block[] = (bp.configuration.blocks ?? []).map((b) => ({
      ...b,
      id: newBlockId(),
    }));
    const { data, error } = await supabase
      .from("projects")
      .insert({
        owner_id: user!.id,
        title: `${bp.name} · nuevo proyecto`,
        description: bp.configuration.description ?? "",
        aura: bp.configuration.aura ?? randomAura(),
        blocks,
      })
      .select("id").single();
    setBusy(null);
    if (error) return toast(error.message);
    toast(`Proyecto creado desde “${bp.name}”`);
    router.push(`/projects/${data.id}`);
  }

  return (
    <main className="mx-auto max-w-[1180px] px-7 pb-24 pt-11">
      <p className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Sistema de Blueprints</p>
      <h1 className="font-display text-[clamp(28px,4vw,40px)] font-semibold leading-[1.08] tracking-tight">
        No son plantillas.<br />Son <em className="not-italic text-brand">estructuras que convierten</em>.
      </h1>
      <p className="mt-2.5 max-w-[580px] text-[15px] leading-relaxed text-muted">
        Guardá cualquier proyecto como Blueprint desde su página (la IA lo nombra y categoriza),
        y reutilizalo aquí con un clic.
      </p>

      {blueprints.length === 0 ? (
        <p className="mt-8 rounded-card border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
          Tu biblioteca está vacía. Abrí un proyecto y usá “Guardar como Blueprint”.
        </p>
      ) : (
        <div className="mt-7 grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
          {blueprints.map((bp) => (
            <article key={bp.id} className="rise rounded-card border border-line bg-white p-[22px] transition hover:-translate-y-[3px] hover:shadow-[0_16px_40px_rgba(20,20,40,.10)]">
              <span className="rounded-full bg-brand-soft px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-brand">
                {bp.category}
              </span>
              <h3 className="mb-1.5 mt-3.5 font-display text-[19px] font-semibold">{bp.name}</h3>
              <p className="text-[13.5px] leading-relaxed text-muted">{bp.configuration.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {(bp.configuration.blocks ?? []).map((b, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-xs text-[#B9BCC4]">→</span>}
                    <b className="whitespace-nowrap rounded-lg border border-line bg-canvas px-2 py-1 text-[11.5px] font-semibold text-ink-2">
                      {BLOCK_DEFS[b.type]?.name ?? b.type}
                    </b>
                  </span>
                ))}
              </div>
              <div className="mt-[18px] flex items-center justify-between border-t border-line pt-3.5">
                <span className="font-mono text-[11px] text-muted">
                  {new Date(bp.created_at).toLocaleDateString("es-AR")}
                </span>
                <button onClick={() => useBlueprint(bp)} disabled={busy === bp.id}
                  className="rounded-[9px] border border-line bg-white px-3 py-[7px] text-[12.5px] font-semibold transition hover:border-ink">
                  {busy === bp.id ? "Creando…" : "Usar blueprint"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
