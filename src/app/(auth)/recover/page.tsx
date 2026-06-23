"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/update-password`,
    });
    if (error) return setError(error.message);
    setSent(true);
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted mb-2">Recuperar acceso</p>
      <h2 className="font-display text-3xl font-semibold tracking-tight">Te enviamos un enlace</h2>
      {sent ? (
        <p className="mt-4 text-muted leading-relaxed">
          Si existe una cuenta con ese correo, vas a recibir un enlace para crear una contraseña nueva.
        </p>
      ) : (
        <>
          <div className="mt-8">
            <input className="input" type="email" placeholder="Tu email" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button className="btn-primary mt-5 w-full">Enviar enlace</button>
        </>
      )}
      <p className="mt-5 text-sm text-muted">
        <Link href="/login" className="hover:text-ink underline">← Volver a entrar</Link>
      </p>
    </form>
  );
}
