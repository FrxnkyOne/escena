"use client";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Block } from "@/lib/types";

export function ExperienceClient({
  slug,
  title,
  description,
  blocks,
  printMode,
}: {
  slug: string;
  title: string;
  description: string;
  blocks: Block[];
  printMode?: boolean;
}) {
  const [name, setName] = useState("");
  const [entered, setEntered] = useState(!!printMode);
  const [step, setStep] = useState(0);
  const total = blocks.length;

  async function enter(e: React.FormEvent) {
    e.preventDefault();
    setEntered(true);
    // Registro de visita (anónimo, vía RPC pública).
    createClient().rpc("record_visit", { p_slug: slug, p_name: name || "Anónimo" }).then(() => {});
  }

  return (
    <div className="stage flex min-h-screen flex-col">
      {!printMode && (
        <span className="no-print absolute left-1/2 top-4 z-[2] max-w-[90vw] -translate-x-1/2 truncate rounded-full border border-white/10 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#7E8093] backdrop-blur">
          escena · /experience/{slug} · sin registro
        </span>
      )}

      {!entered ? (
        <section className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <p className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#9A9CB0]">
            Una experiencia preparada para vos
          </p>
          <h1 className="max-w-3xl font-display text-[clamp(32px,5vw,54px)] font-medium leading-[1.08] tracking-tight text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-3.5 max-w-md leading-relaxed text-[#A8AABA]">{description}</p>
          )}
          <form onSubmit={enter} className="mt-8 flex w-[min(440px,90vw)] flex-col gap-2.5 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              autoComplete="off"
              className="stage-input flex-1 text-[15px]"
              aria-label="Tu nombre"
            />
            <button className="rounded-[13px] bg-white px-5 py-3.5 text-[14.5px] font-bold text-[#0B0C12] transition hover:-translate-y-px">
              Entrar a la experiencia
            </button>
          </form>
          <p className="mt-4 font-mono text-[10.5px] tracking-[0.06em] text-[#6E7083]">
            SIN CUENTA · SIN DESCARGA · SOLO TU NOMBRE
          </p>
        </section>
      ) : (
        <section className="flex-1 px-6 pb-20 pt-14">
          {!printMode && (
            <div className="no-print mx-auto mb-10 flex max-w-[880px] gap-2" aria-label="Progreso">
              {blocks.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  aria-label={`Paso ${i + 1}`}
                  className={`h-1 flex-1 rounded-full transition ${
                    i < step ? "bg-[#8B89FF]" : i === step ? "bg-white" : "bg-white/15"
                  }`}
                />
              ))}
            </div>
          )}

          <div className="mx-auto max-w-[880px]">
            {blocks.map((b, i) => (
              <div
                key={b.id}
                className={printMode ? "print-panel mb-16" : i === step ? "rise block" : "hidden"}
              >
                <BlockView block={b} index={i} clientName={name} projectTitle={title} />
              </div>
            ))}
          </div>

          {!printMode && (
            <div className="no-print mx-auto mt-12 flex max-w-[880px] justify-between">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                style={{ visibility: step === 0 ? "hidden" : "visible" }}
                className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setStep((s) => (s < total - 1 ? s + 1 : 0))}
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0B0C12]"
              >
                {step === total - 1 ? "Volver al inicio" : "Continuar →"}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/* ---------- renderer de bloques ---------- */
function BlockView({
  block, index, clientName, projectTitle,
}: { block: Block; index: number; clientName: string; projectTitle: string }) {
  const num = String(index + 1).padStart(2, "0");
  const c = (block.content ?? {}) as Record<string, unknown>;
  const Eyebrow = ({ children }: { children: React.ReactNode }) => (
    <p className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#8B8DA1]">{num} · {children}</p>
  );
  const H = ({ children }: { children: React.ReactNode }) => (
    <h2 className="font-display text-[clamp(25px,3.4vw,37px)] font-medium tracking-tight text-white">{children}</h2>
  );

  switch (block.type) {
    case "hero":
      return (
        <>
          <Eyebrow>Apertura</Eyebrow>
          <H>{(c.headline as string) ?? `${clientName ? `Hola, ${clientName}. ` : ""}Esto no es un PDF.`}</H>
          <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-[#B4B6C6]">
            {(c.lead as string) ?? `${projectTitle}. Recorré el plan completo a tu ritmo y elegí el camino que prefieras.`}
          </p>
        </>
      );
    case "video":
      return (
        <>
          <Eyebrow>Video</Eyebrow>
          <H>{block.title !== "Video" ? block.title : "Mirá la idea en movimiento."}</H>
          <div className="mt-8 grid aspect-video cursor-pointer place-items-center rounded-[18px] border border-white/15 bg-gradient-to-br from-[#5E5BFF]/25 to-[#FF6A5B]/20 transition hover:scale-[1.01]">
            <div className="grid h-[70px] w-[70px] place-items-center rounded-full bg-white/95 pl-1 text-[22px] text-[#0B0C12]">▶</div>
          </div>
        </>
      );
    case "timeline": {
      const phases = (c.phases as { when: string; title: string; desc: string }[]) ?? [
        { when: "DÍAS 1–15", title: "Fundación", desc: "Narrativa, ángulos y materiales base." },
        { when: "DÍAS 16–45", title: "Ejecución", desc: "Lanzamiento del plan en los canales acordados." },
        { when: "DÍAS 46–90", title: "Amplificación", desc: "Capitalización de resultados y distribución." },
      ];
      return (
        <>
          <Eyebrow>El plan en el tiempo</Eyebrow>
          <H>{block.title !== "Timeline" ? block.title : "El plan, en movimientos claros."}</H>
          <div className="mt-8 border-l border-white/20 pl-[26px]">
            {phases.map((p, i) => (
              <div key={i} className="tl-dot relative pb-[26px]">
                <span className="font-mono text-[10.5px] tracking-[0.06em] text-[#6E7083]">{p.when}</span>
                <b className="block text-[15px] font-semibold text-white">{p.title}</b>
                <span className="text-[13px] text-[#9A9CB0]">{p.desc}</span>
              </div>
            ))}
          </div>
        </>
      );
    }
    case "pricing":
      return <Pricing num={num} content={c} />;
    case "compare":
      return (
        <>
          <Eyebrow>Comparativa</Eyebrow>
          <H>Las diferencias, claras.</H>
          <table className="mt-8 w-full border-collapse text-[13.5px]">
            <thead>
              <tr>{["", "Presencia", "Posicionamiento", "Autoridad"].map((h, i) => (
                <th key={i} className="border-b border-white/15 px-3 py-3 text-left font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#9D9FFB]">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {[["Alcance", "Base", "Ampliado", "Máximo"],
                ["Estrategia dedicada", "—", "Incluida", "Incluida"],
                ["Amplificación", "—", "Incluida", "Incluida"],
                ["Sala mensual", "—", "—", "Incluida"]].map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className={`border-b border-white/10 px-3 py-3 ${
                      j === 0 ? "font-semibold text-white" : cell === "—" ? "text-[#5A5C6E]" : "text-[#C6C8D6]"
                    }`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      );
    case "gallery":
      return (
        <>
          <Eyebrow>Casos y piezas</Eyebrow>
          <H>Resultados que podés ver.</H>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {["#FF6A5B,#FFD3A1", "#0E6B5C,#9BE8C9", "#2A2ACB,#9FD0FF", "#8A4B00,#FFD98A", "#5B2A86,#F0B6FF", "#10131F,#5E7AC0"].map((g, i) => (
              <div key={i} className="aspect-[4/3] rounded-[14px] border border-white/10"
                style={{ background: `linear-gradient(135deg,${g})` }} />
            ))}
          </div>
        </>
      );
    case "quotes":
      return (
        <>
          <Eyebrow>Lo que dicen</Eyebrow>
          <H>Clientes que ya pasaron por aquí.</H>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              ["Pasamos de enviar PDFs a compartir experiencias. La diferencia en respuestas fue inmediata.", "Min-Ji K.", "Directora"],
              ["Entendieron nuestro mercado mejor que agencias locales con las que trabajé años.", "L. Ali", "Especialista"],
            ].map(([q, n, r], i) => (
              <div key={i} className="rounded-2xl border border-white/15 bg-white/5 p-[22px]">
                <p className="text-[14.5px] italic leading-relaxed text-[#DDDEE8]">{q}</p>
                <b className="mt-3.5 block text-[13px] text-white">{n}</b>
                <span className="text-xs text-[#9A9CB0]">{r}</span>
              </div>
            ))}
          </div>
        </>
      );
    case "form":
      return <FormBlock num={num} />;
    case "sign":
      return <SignBlock num={num} clientName={clientName} />;
    case "cta":
      return (
        <>
          <Eyebrow>Siguiente paso</Eyebrow>
          <H>Listo. El siguiente paso es una conversación.</H>
          <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-[#B4B6C6]">
            Tu recorrido quedó registrado. Agendá la reunión directamente, o volvé a explorar
            la experiencia cuando quieras: el enlace es tuyo.
          </p>
          <button className="mt-9 rounded-[15px] bg-white px-9 py-4 font-display text-[17px] font-bold text-[#0B0C12] transition hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(255,255,255,.18)]">
            Agendar reunión →
          </button>
        </>
      );
  }
}

function Pricing({ num, content }: { num: string; content: Record<string, unknown> }) {
  const [sel, setSel] = useState(1);
  const plans = useMemo(
    () =>
      (content.plans as { tier: string; name: string; features: string[] }[]) ?? [
        { tier: "Esencial", name: "Presencia", features: ["Alcance base", "Materiales de marca", "Reporte de resultados"] },
        { tier: "Recomendado", name: "Posicionamiento", features: ["Alcance ampliado", "Estrategia dedicada", "Amplificación digital"] },
        { tier: "Completo", name: "Autoridad", features: ["Cobertura múltiple", "Gestión continua", "Sala de estrategia mensual"] },
      ],
    [content]
  );
  return (
    <>
      <p className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#8B8DA1]">{num} · Elegí tu camino</p>
      <h2 className="font-display text-[clamp(25px,3.4vw,37px)] font-medium tracking-tight text-white">
        Tocá el plan que es para vos.
      </h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {plans.map((p, i) => (
          <button key={i} onClick={() => setSel(i)}
            className={`plan-card p-[22px] text-left ${sel === i ? "sel" : ""}`}>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#9D9FFB]">{p.tier}</span>
            <h4 className="mb-3 mt-2.5 font-display text-xl font-semibold text-white">{p.name}</h4>
            <ul className="text-[13px] leading-[1.9] text-[#C6C8D6]">
              {p.features.map((f, j) => (
                <li key={j}><span className="text-[#8B89FF]">— </span>{f}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </>
  );
}

function FormBlock({ num }: { num: string }) {
  const [sent, setSent] = useState(false);
  return (
    <>
      <p className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#8B8DA1]">{num} · Contanos de vos</p>
      <h2 className="font-display text-[clamp(25px,3.4vw,37px)] font-medium tracking-tight text-white">Dos datos y seguimos.</h2>
      {sent ? (
        <p className="mt-8 max-w-md text-[#B4B6C6]">Respuesta registrada — gracias. Continuá con la experiencia.</p>
      ) : (
        <div className="mt-8 flex max-w-md flex-col gap-3">
          <input className="stage-input text-sm" placeholder="Empresa o marca" />
          <textarea className="stage-input resize-y text-sm" rows={3} placeholder="¿Qué te gustaría lograr en los próximos 90 días?" />
          <button onClick={() => setSent(true)}
            className="self-start rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0B0C12]">
            Enviar
          </button>
        </div>
      )}
    </>
  );
}

function SignBlock({ num, clientName }: { num: string; clientName: string }) {
  const [signed, setSigned] = useState(false);
  return (
    <>
      <p className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#8B8DA1]">{num} · El acuerdo</p>
      <h2 className="font-display text-[clamp(25px,3.4vw,37px)] font-medium tracking-tight text-white">
        Cuando estés a gusto, firmá aquí.
      </h2>
      <button
        onClick={() => setSigned(true)}
        className={`mt-8 grid min-h-[120px] w-full max-w-md place-items-center rounded-2xl border-[1.5px] transition ${
          signed ? "border-solid border-[#7EE3B0]" : "border-dashed border-white/30 hover:border-[#8B89FF]"
        }`}
      >
        {signed ? (
          <span className="font-display text-[34px] font-light italic text-white">{clientName || "Firmado"}</span>
        ) : (
          <span className="text-sm text-[#9A9CB0]">Tocá para firmar digitalmente</span>
        )}
      </button>
    </>
  );
}
