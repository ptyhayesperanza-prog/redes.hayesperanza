"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ActualizarContrasenaForm() {
  const router = useRouter();
  const [listo, setListo] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    async function prepararSesion() {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError("El enlace no es válido o ya expiró. Pide uno nuevo desde /recuperar.");
        }
      }
      setListo(true);
    }

    prepararSesion();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setCargando(false);

    if (error) {
      setError("No se pudo actualizar la contraseña.");
      return;
    }

    setGuardado(true);
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1200);
  }

  if (!listo) {
    return <p className="text-sm opacity-80">Verificando enlace...</p>;
  }

  if (guardado) {
    return (
      <p className="text-sm" style={{ color: "var(--status-al-dia)" }}>
        Contraseña actualizada. Entrando...
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm opacity-80">
          Nueva contraseña
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
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
        {cargando ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}
