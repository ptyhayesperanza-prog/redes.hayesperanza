"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setCargando(false);

    if (error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm opacity-80">
          Correo
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border bg-transparent px-3 py-2 outline-none focus:ring-2"
          style={{ borderColor: "var(--surface-border)" }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm opacity-80">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border bg-transparent px-3 py-2 outline-none focus:ring-2"
          style={{ borderColor: "var(--surface-border)" }}
        />
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--status-falto)" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="mt-2 rounded-lg px-4 py-2 font-medium text-[var(--accent-foreground)] disabled:opacity-60"
        style={{ background: "var(--accent)" }}
      >
        {cargando ? "Entrando..." : "Entrar"}
      </button>

      <Link href="/recuperar" className="text-center text-sm underline opacity-80">
        ¿Olvidaste tu contraseña?
      </Link>
      <Link href="/registro" className="text-center text-sm underline opacity-80">
        ¿No tienes cuenta? Regístrate
      </Link>
    </form>
  );
}
