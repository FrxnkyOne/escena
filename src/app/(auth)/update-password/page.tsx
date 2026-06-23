"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setError(error.message);
    router.push("/dashboard");
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm">
      <h2 className="font-display text-3xl font-semibold tracking-tight">Nueva contraseña</h2>
      <div className="mt-8">
        <input className="input" type="password" placeholder="Nueva contraseña" value={password}
          onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button className="btn-primary mt-5 w-full">Guardar y entrar</button>
    </form>
  );
}
