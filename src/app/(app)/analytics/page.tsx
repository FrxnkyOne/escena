import { createClient } from "@/lib/supabase/server";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  // Visitas reales registradas por record_visit() en la vista cliente.
  const { data: visits } = await supabase
    .from("experience_visits")
    .select("visitor_name, entered_at, client_spaces(slug, projects(title))")
    .order("entered_at", { ascending: false })
    .limit(12);

  const bars = [3, 5, 2, 6, 4, 8, 7, 5, 9, 6, 11, 8, 12, 9];
  const max = Math.max(...bars);

  return (
    <main className="mx-auto max-w-[1180px] px-7 pb-24 pt-11">
      <p className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        Analytics <span className="ml-2 rounded-full bg-brand-soft px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.1em] text-brand">Vista previa</span>
      </p>
      <h1 className="font-display text-[clamp(28px,4vw,40px)] font-semibold leading-[1.08] tracking-tight">
        Tu propuesta te cuenta <em className="not-italic text-brand">cómo la leyeron</em>.
      </h1>
      <p className="mt-2.5 max-w-[580px] text-[15px] leading-relaxed text-muted">
        Las visitas con nombre ya se registran en cada experiencia compartida. Tiempos por sección
        y mapas de lectura llegan en la próxima iteración.
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["Aperturas", String(visits?.length ?? 0), "registradas en vivo"],
          ["Tiempo promedio", "—", "próximamente"],
          ["Lectura completa", "—", "próximamente"],
          ["Planes explorados", "—", "próximamente"]].map(([l, v, s]) => (
          <div key={l} className="rounded-card border border-line bg-white px-5 py-4">
            <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{l}</label>
            <b className="mt-1.5 block font-display text-3xl font-semibold tracking-tight">{v}</b>
            <span className="text-xs font-semibold text-green-700">{s}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-card border border-line bg-white p-5">
          <h3 className="font-display text-[15.5px] font-semibold">Aperturas · últimos 14 días</h3>
          <p className="mb-4 text-xs text-muted">Mockup de visualización — se conecta a experience_visits.</p>
          <div className="flex h-[150px] items-end gap-2">
            {bars.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col justify-end gap-1.5 text-center">
                <i className="block rounded-t-[7px] bg-gradient-to-b from-[#5E5BFF] to-brand transition hover:brightness-110"
                  style={{ height: `${(v / max) * 100}%` }} />
                <span className="font-mono text-[9.5px] text-muted">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-card border border-line bg-white p-5">
          <h3 className="font-display text-[15.5px] font-semibold">Secciones más visitadas</h3>
          <p className="mb-4 text-xs text-muted">Dónde se detienen tus clientes (mockup).</p>
          {[["Selección de planes", 92], ["Cronograma", 74], ["Apertura", 61], ["Galería", 44], ["Firma", 28]].map(([n, w]) => (
            <div key={n as string} className="mb-3 text-[13px]">
              <div className="mb-1 flex justify-between"><b>{n}</b></div>
              <div className="h-[7px] overflow-hidden rounded-full bg-[#EDEEF2]">
                <div className="h-full rounded-full bg-gradient-to-r from-brand to-[#9C4DFF]" style={{ width: `${w}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-card border border-line bg-white p-5">
        <h3 className="font-display text-[15.5px] font-semibold">Visitas recientes (en vivo)</h3>
        <p className="mb-3 text-xs text-muted">El cliente solo deja su nombre — suficiente para saber quién está mirando.</p>
        {!visits?.length ? (
          <p className="text-sm text-muted">Todavía no hay visitas. Compartí una experiencia para empezar a registrar.</p>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {["Visitante", "Experiencia", "Cuándo"].map((h) => (
                  <th key={h} className="border-b border-line px-1 py-2 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visits.map((v, i) => {
                const cs = v.client_spaces as unknown as { slug: string; projects: { title: string } } | null;
                return (
                  <tr key={i}>
                    <td className="border-b border-line px-1 py-2.5 font-semibold">{v.visitor_name}</td>
                    <td className="border-b border-line px-1 py-2.5 text-ink-2">{cs?.projects?.title ?? cs?.slug ?? "—"}</td>
                    <td className="border-b border-line px-1 py-2.5 text-muted">
                      {new Date(v.entered_at).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
