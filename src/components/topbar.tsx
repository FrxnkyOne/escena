"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard", label: "Proyectos" },
  { href: "/import", label: "Importar" },
  { href: "/blueprints", label: "Blueprints" },
  { href: "/styles", label: "Estilos" },
  { href: "/analytics", label: "Analytics" },
];

export function Topbar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const initials = userName.slice(0, 2).toUpperCase() || "U";

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="no-print sticky top-0 z-50 flex items-center gap-6 border-b border-line bg-canvas/85 px-7 py-3.5 backdrop-blur-xl">
      <Link href="/dashboard" className="flex items-baseline gap-2.5">
        <b className="font-display text-[21px] font-bold tracking-tight">Escena</b>
        <span className="hidden font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted sm:inline">
          experiencias, no documentos
        </span>
      </Link>
      <nav className="hidden gap-0.5 md:flex">
        {NAV.map((n) => {
          const active = pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-[10px] px-3.5 py-2 text-[13.5px] font-medium transition ${
                active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <button onClick={logout} className="text-[13px] text-muted transition hover:text-ink">
          Salir
        </button>
        <div
          className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg,#FF6A5B,#FF9D6C,#FFD3A1)" }}
          aria-label={userName}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
