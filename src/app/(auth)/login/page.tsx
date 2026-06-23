"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted mb-2">Bienvenido de vuelta</p>
      <h2 className="font-display text-3xl font-semibold tracking-tight">Entrá a tu workspace</h2>
      <div className="mt-8 space-y-3">
        <input className="input" type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <input className="input" type="password" placeholder="Contraseña" value={password}
          onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="btn-primary mt-5 w-full">
        {loading ? "Entrando…" : "Entrar"}
      </button>
      <div className="mt-5 flex justify-between text-sm text-muted">
        <Link href="/recover" className="hover:text-ink">Olvidé mi contraseña</Link>
        <Link href="/register" className="hover:text-ink">Crear cuenta →</Link>
      </div>
    </form>
  );
}
