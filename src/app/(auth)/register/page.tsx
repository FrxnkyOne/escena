"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) return setError(error.message);
    setDone(true);
  }

  if (done)
    return (
      <div className="w-full max-w-sm">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Revisá tu correo</h2>
        <p className="mt-3 text-muted leading-relaxed">
          Te enviamos un enlace para confirmar tu cuenta. Al confirmarla vas a entrar directo a tu workspace.
        </p>
      </div>
    );

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted mb-2">Crear cuenta</p>
      <h2 className="font-display text-3xl font-semibold tracking-tight">Tu primer proyecto te espera</h2>
      <div className="mt-8 space-y-3">
        <input className="input" placeholder="Nombre" value={name}
          onChange={(e) => setName(e.target.value)} required />
        <input className="input" type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <input className="input" type="password" placeholder="Contraseña (mín. 6 caracteres)" value={password}
          onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="btn-primary mt-5 w-full">
        {loading ? "Creando…" : "Crear cuenta"}
      </button>
      <p className="mt-5 text-sm text-muted">
        ¿Ya tenés cuenta? <Link href="/login" className="hover:text-ink underline">Entrar</Link>
      </p>
    </form>
  );
}
