export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* lado escenario */}
      <div className="stage hidden lg:flex flex-col justify-between p-12">
        <div className="flex items-baseline gap-3">
          <b className="font-display text-2xl tracking-tight text-white">Escena</b>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[#9a9cb0]">
            experiencias, no documentos
          </span>
        </div>
        <div>
          <h1 className="font-display text-5xl font-medium leading-[1.05] tracking-tight text-white max-w-md">
            Tu cliente no quiere otro PDF.
          </h1>
          <p className="mt-5 max-w-sm text-[#a8aaba] leading-relaxed">
            Creá propuestas, pitches, reportes y portales que se navegan como un producto —
            y compartilos con un solo enlace.
          </p>
        </div>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#6e7083]">
          Workspace · Blueprints · AI Strategist · Vista cliente
        </p>
      </div>
      {/* lado backstage */}
      <div className="flex items-center justify-center p-8">{children}</div>
    </div>
  );
}
